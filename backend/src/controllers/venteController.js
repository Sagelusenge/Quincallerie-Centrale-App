import pool from '../config/db.js';

const toNumber = (value) => Number(value);

const nextId = async (connection, nomTable, prefix, size = 5) => {
    await connection.query(
        `UPDATE sequences SET derniere_valeur = derniere_valeur + 1 WHERE nom_table = ?`,
        [nomTable]
    );
    const [rows] = await connection.query(
        `SELECT derniere_valeur FROM sequences WHERE nom_table = ?`,
        [nomTable]
    );
    return `${prefix}-${String(rows[0].derniere_valeur).padStart(size, '0')}`;
};

// GET /api/ventes
export const getAllVentes = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT v.*, c.nom AS client_nom,
                    IFNULL(SUM(p.montant), 0) AS total_paye,
                    (v.montant_ttc - IFNULL(SUM(p.montant), 0)) AS reste_a_payer
             FROM ventes v
             JOIN client c ON v.client_id = c.id_client
             LEFT JOIN paiement p ON v.id_ventes = p.vente_id
             WHERE v.entreprise_id = ?
             GROUP BY v.id_ventes
             ORDER BY v.date_vente DESC`,
            [entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/ventes/:id
export const getVenteById = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;
    try {
        const [ventes] = await pool.query(
            `SELECT v.*, c.nom AS client_nom, c.telephone AS client_tel,
                    e.raison_sociale AS entreprise_nom, e.ville
             FROM ventes v
             JOIN client c ON v.client_id = c.id_client
             JOIN entreprise e ON v.entreprise_id = e.id_entreprise
             WHERE v.id_ventes = ? AND v.entreprise_id = ?`,
            [id, entreprise_id]
        );

        if (ventes.length === 0) {
            return res.status(404).json({ success: false, message: 'Vente non trouvee' });
        }

        const [lignes] = await pool.query(
            `SELECT lv.*, p.nom AS produit_nom,
                    (lv.quantite * lv.prix_unitaire_ht) AS total_ht,
                    (lv.quantite * lv.prix_unitaire_ht * 1.16) AS total_ttc
             FROM lignes_ventes lv
             JOIN produits p ON lv.produit_id = p.id_produit
             WHERE lv.vente_id = ? AND p.entreprise_id = ?`,
            [id, entreprise_id]
        );

        const [paiements] = await pool.query(
            `SELECT p.*
             FROM paiement p
             JOIN ventes v ON p.vente_id = v.id_ventes
             WHERE p.vente_id = ? AND v.entreprise_id = ?`,
            [id, entreprise_id]
        );

        res.json({
            success: true,
            data: { ...ventes[0], lignes, paiements }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/ventes
export const createVente = async (req, res) => {
    const { client_id, articles } = req.body;
    const entreprise_id = req.user.entreprise_id;

    if (!client_id || !Array.isArray(articles) || articles.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'Client et articles requis'
        });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [clients] = await connection.query(
            `SELECT id_client FROM client WHERE id_client = ? AND entreprise_id = ?`,
            [client_id, entreprise_id]
        );
        if (clients.length === 0) {
            throw new Error('Client introuvable dans votre entreprise.');
        }

        const lignes = [];
        for (const article of articles) {
            const produit_id = article.produit_id || article.id;
            const quantite = toNumber(article.quantite ?? article.qte);

            if (!produit_id || !Number.isFinite(quantite) || quantite <= 0) {
                throw new Error('Chaque article doit contenir un produit et une quantite positive.');
            }

            const [produits] = await connection.query(
                `SELECT id_produit, prix_ht, quantite_stock
                 FROM produits
                 WHERE id_produit = ? AND entreprise_id = ?
                 FOR UPDATE`,
                [produit_id, entreprise_id]
            );
            if (produits.length === 0) {
                throw new Error(`Produit ${produit_id} introuvable dans votre entreprise.`);
            }
            if (produits[0].quantite_stock < quantite) {
                throw new Error(`Stock insuffisant pour le produit ${produit_id}.`);
            }

            const prix = article.prix !== undefined
                ? toNumber(article.prix)
                : toNumber(produits[0].prix_ht);
            if (!Number.isFinite(prix) || prix <= 0) {
                throw new Error('Le prix unitaire doit etre positif.');
            }

            lignes.push({ produit_id, quantite, prix });
        }

        await connection.query(
            `INSERT INTO ventes (client_id, entreprise_id, montant_ttc)
             VALUES (?, ?, 0)`,
            [client_id, entreprise_id]
        );

        const [seq] = await connection.query(
            `SELECT derniere_valeur FROM sequences WHERE nom_table = 'ventes'`
        );
        const facture_id = `FAC-${new Date().getFullYear()}-${String(seq[0].derniere_valeur).padStart(5, '0')}`;

        for (const ligne of lignes) {
            const id_ligne = await nextId(connection, 'lignes_ventes', 'LVT', 6);
            await connection.query(
                `INSERT INTO lignes_ventes
                 (id_lignes_ventes, vente_id, produit_id, quantite, prix_unitaire_ht)
                 VALUES (?, ?, ?, ?, ?)`,
                [id_ligne, facture_id, ligne.produit_id, ligne.quantite, ligne.prix]
            );
        }

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Vente enregistree avec succes',
            facture: facture_id,
            id: facture_id
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

const ensureNoPayment = async (connection, vente_id, entreprise_id) => {
    const [rows] = await connection.query(
        `SELECT IFNULL(SUM(p.montant), 0) AS total_paye
         FROM ventes v
         LEFT JOIN paiement p ON p.vente_id = v.id_ventes
         WHERE v.id_ventes = ? AND v.entreprise_id = ?
         GROUP BY v.id_ventes`,
        [vente_id, entreprise_id]
    );

    if (rows.length === 0) {
        throw new Error('Facture introuvable');
    }

    if (Number(rows[0].total_paye) > 0) {
        throw new Error('Impossible de modifier ou supprimer une facture deja payee');
    }
};

const restoreSaleStock = async (connection, vente_id) => {
    const [lignes] = await connection.query(
        `SELECT produit_id, quantite FROM lignes_ventes WHERE vente_id = ?`,
        [vente_id]
    );

    for (const ligne of lignes) {
        await connection.query(
            `UPDATE produits SET quantite_stock = quantite_stock + ? WHERE id_produit = ?`,
            [ligne.quantite, ligne.produit_id]
        );
    }
};

// PUT /api/ventes/:id
export const updateVente = async (req, res) => {
    const { id } = req.params;
    const { client_id, articles } = req.body;
    const entreprise_id = req.user.entreprise_id;

    if (!client_id || !Array.isArray(articles) || articles.length === 0) {
        return res.status(400).json({ success: false, message: 'Client et articles requis' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await ensureNoPayment(connection, id, entreprise_id);

        const [clients] = await connection.query(
            `SELECT id_client FROM client WHERE id_client = ? AND entreprise_id = ?`,
            [client_id, entreprise_id]
        );
        if (clients.length === 0) {
            throw new Error('Client introuvable dans votre entreprise.');
        }

        await restoreSaleStock(connection, id);
        await connection.query(`DELETE FROM lignes_ventes WHERE vente_id = ?`, [id]);
        await connection.query(
            `UPDATE ventes SET client_id = ?, montant_ttc = 0 WHERE id_ventes = ? AND entreprise_id = ?`,
            [client_id, id, entreprise_id]
        );

        for (const article of articles) {
            const produit_id = article.produit_id || article.id;
            const quantite = toNumber(article.quantite ?? article.qte);

            if (!produit_id || !Number.isFinite(quantite) || quantite <= 0) {
                throw new Error('Chaque article doit contenir un produit et une quantite positive.');
            }

            const [produits] = await connection.query(
                `SELECT id_produit, prix_ht, quantite_stock
                 FROM produits
                 WHERE id_produit = ? AND entreprise_id = ?
                 FOR UPDATE`,
                [produit_id, entreprise_id]
            );
            if (produits.length === 0) {
                throw new Error(`Produit ${produit_id} introuvable dans votre entreprise.`);
            }
            if (produits[0].quantite_stock < quantite) {
                throw new Error(`Stock insuffisant pour le produit ${produit_id}.`);
            }

            const prix = article.prix !== undefined ? toNumber(article.prix) : toNumber(produits[0].prix_ht);
            if (!Number.isFinite(prix) || prix <= 0) {
                throw new Error('Le prix unitaire doit etre positif.');
            }

            const id_ligne = await nextId(connection, 'lignes_ventes', 'LVT', 6);
            await connection.query(
                `INSERT INTO lignes_ventes
                 (id_lignes_ventes, vente_id, produit_id, quantite, prix_unitaire_ht)
                 VALUES (?, ?, ?, ?, ?)`,
                [id_ligne, id, produit_id, quantite, prix]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Facture mise a jour' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// DELETE /api/ventes/:id
export const deleteVente = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        await ensureNoPayment(connection, id, entreprise_id);
        await restoreSaleStock(connection, id);

        const [result] = await connection.query(
            `DELETE FROM ventes WHERE id_ventes = ? AND entreprise_id = ?`,
            [id, entreprise_id]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Facture introuvable' });
        }

        await connection.commit();
        res.json({ success: true, message: 'Facture supprimee' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};
