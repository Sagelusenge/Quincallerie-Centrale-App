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

const recalculateVenteTotal = async (connection, venteId) => {
    await connection.query(
        `UPDATE ventes
         SET montant_ttc = (
             SELECT IFNULL(SUM(quantite * prix_unitaire_ht), 0) * 1.16
             FROM lignes_ventes
             WHERE vente_id = ?
         )
         WHERE id_ventes = ?`,
        [venteId, venteId]
    );
};

const formatPanier = (row) => {
    if (!row) return row;
    return {
        ...row,
        id_panier: row.id_devis,
        numero_panier: row.numero_devis,
        date_panier: row.date_devis
    };
};

// GET /api/paniers
export const getAllPaniers = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT d.*,
                    COALESCE(NULLIF(d.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) AS montant_ttc,
                    COALESCE(NULLIF(d.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) AS total_ttc,
                    c.nom AS client_nom, c.postnom AS client_postnom
             FROM devis d
             JOIN client c ON d.client_id = c.id_client
             LEFT JOIN (
                SELECT devis_id, SUM(quantite * prix_unitaire_ht) * 1.16 AS total_ttc
                FROM lignes_devis
                GROUP BY devis_id
             ) line_totals ON line_totals.devis_id = d.id_devis
             WHERE d.entreprise_id = ?
             ORDER BY d.date_devis DESC`,
            [entreprise_id]
        );
        res.json({ success: true, data: rows.map(formatPanier) });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/paniers/:id
export const getPanierById = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;
    try {
        const [panier] = await pool.query(
            `SELECT d.*, c.nom AS client_nom, c.telephone AS client_tel,
                    e.raison_sociale AS entreprise_nom, e.ville AS entreprise_ville
             FROM devis d
             JOIN client c ON d.client_id = c.id_client
             JOIN entreprise e ON d.entreprise_id = e.id_entreprise
             WHERE d.id_devis = ? AND d.entreprise_id = ?`,
            [id, entreprise_id]
        );

        if (panier.length === 0) {
            return res.status(404).json({ success: false, message: 'Panier non trouve' });
        }

        const [lignes] = await pool.query(
            `SELECT ld.*, p.nom AS produit_nom
             FROM lignes_devis ld
             JOIN produits p ON ld.produit_id = p.id_produit
             WHERE ld.devis_id = ? AND p.entreprise_id = ?`,
            [id, entreprise_id]
        );

        res.json({ success: true, data: { ...formatPanier(panier[0]), lignes } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/paniers
export const createPanier = async (req, res) => {
    const { client_id, lignes } = req.body;
    const entreprise_id = req.user.entreprise_id;

    if (!client_id || !Array.isArray(lignes) || lignes.length === 0) {
        return res.status(400).json({ success: false, message: 'Client et lignes requis' });
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

        await connection.query(
            `INSERT INTO devis (client_id, entreprise_id) VALUES (?, ?)`,
            [client_id, entreprise_id]
        );

        const [seq] = await connection.query(
            `SELECT derniere_valeur FROM sequences WHERE nom_table = 'devis'`
        );
        const id_panier = `DEV-${String(seq[0].derniere_valeur).padStart(5, '0')}`;

        for (const ligne of lignes) {
            const quantite = toNumber(ligne.quantite);
            if (!ligne.produit_id || !Number.isFinite(quantite) || quantite <= 0) {
                throw new Error('Chaque ligne doit contenir un produit et une quantite positive.');
            }

            const [produits] = await connection.query(
                `SELECT id_produit, prix_ht
                 FROM produits
                 WHERE id_produit = ? AND entreprise_id = ?`,
                [ligne.produit_id, entreprise_id]
            );
            if (produits.length === 0) {
                throw new Error(`Produit ${ligne.produit_id} introuvable dans votre entreprise.`);
            }

            const prix = ligne.prix_unitaire_ht !== undefined
                ? toNumber(ligne.prix_unitaire_ht)
                : toNumber(produits[0].prix_ht);
            if (!Number.isFinite(prix) || prix <= 0) {
                throw new Error('Le prix unitaire doit etre positif.');
            }

            const id_ligne = await nextId(connection, 'lignes_devis', 'LDV', 6);
            await connection.query(
                `INSERT INTO lignes_devis
                 (id_lignes_devis, devis_id, produit_id, quantite, prix_unitaire_ht)
                 VALUES (?, ?, ?, ?, ?)`,
                [id_ligne, id_panier, ligne.produit_id, quantite, prix]
            );
        }

        await connection.commit();
        res.status(201).json({
            success: true,
            message: 'Panier cree avec succes',
            id_panier,
            panier: id_panier
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// PUT /api/paniers/:id
export const updatePanier = async (req, res) => {
    const { id } = req.params;
    const { client_id, lignes } = req.body;
    const entreprise_id = req.user.entreprise_id;

    if (!client_id || !Array.isArray(lignes) || lignes.length === 0) {
        return res.status(400).json({ success: false, message: 'Client et lignes requis' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [panierRows] = await connection.query(
            `SELECT id_devis, statut FROM devis WHERE id_devis = ? AND entreprise_id = ? FOR UPDATE`,
            [id, entreprise_id]
        );

        if (panierRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Panier non trouve' });
        }

        if (panierRows[0].statut !== 'en_attente') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Seul un panier en attente peut etre modifie' });
        }

        const [clients] = await connection.query(
            `SELECT id_client FROM client WHERE id_client = ? AND entreprise_id = ?`,
            [client_id, entreprise_id]
        );
        if (clients.length === 0) {
            throw new Error('Client introuvable dans votre entreprise.');
        }

        await connection.query(
            `UPDATE devis SET client_id = ? WHERE id_devis = ? AND entreprise_id = ?`,
            [client_id, id, entreprise_id]
        );
        await connection.query(`DELETE FROM lignes_devis WHERE devis_id = ?`, [id]);

        for (const ligne of lignes) {
            const quantite = toNumber(ligne.quantite);
            if (!ligne.produit_id || !Number.isFinite(quantite) || quantite <= 0) {
                throw new Error('Chaque ligne doit contenir un produit et une quantite positive.');
            }

            const [produits] = await connection.query(
                `SELECT id_produit, prix_ht FROM produits WHERE id_produit = ? AND entreprise_id = ?`,
                [ligne.produit_id, entreprise_id]
            );
            if (produits.length === 0) {
                throw new Error(`Produit ${ligne.produit_id} introuvable dans votre entreprise.`);
            }

            const prix = ligne.prix_unitaire_ht !== undefined
                ? toNumber(ligne.prix_unitaire_ht)
                : toNumber(produits[0].prix_ht);
            if (!Number.isFinite(prix) || prix <= 0) {
                throw new Error('Le prix unitaire doit etre positif.');
            }

            const id_ligne = await nextId(connection, 'lignes_devis', 'LDV', 6);
            await connection.query(
                `INSERT INTO lignes_devis
                 (id_lignes_devis, devis_id, produit_id, quantite, prix_unitaire_ht)
                 VALUES (?, ?, ?, ?, ?)`,
                [id_ligne, id, ligne.produit_id, quantite, prix]
            );
        }

        await connection.commit();
        res.json({ success: true, message: 'Panier mis a jour' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// POST /api/paniers/:id/convertir
export const convertirPanier = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [panierRows] = await connection.query(
            `SELECT id_devis, client_id, statut
             FROM devis
             WHERE id_devis = ? AND entreprise_id = ?
             FOR UPDATE`,
            [id, entreprise_id]
        );

        if (panierRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Panier non trouve' });
        }

        if (panierRows[0].statut !== 'en_attente') {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Le panier ne peut plus etre converti.' });
        }

        const [lignes] = await connection.query(
            `SELECT ld.produit_id, ld.quantite, ld.prix_unitaire_ht
             FROM lignes_devis ld
             JOIN produits p ON p.id_produit = ld.produit_id
             WHERE ld.devis_id = ? AND p.entreprise_id = ?`,
            [id, entreprise_id]
        );

        if (lignes.length === 0) {
            throw new Error('Impossible de convertir un panier sans lignes.');
        }

        for (const ligne of lignes) {
            const [stocks] = await connection.query(
                `SELECT quantite_stock
                 FROM produits
                 WHERE id_produit = ? AND entreprise_id = ?
                 FOR UPDATE`,
                [ligne.produit_id, entreprise_id]
            );
            if (stocks.length === 0) {
                throw new Error(`Produit ${ligne.produit_id} introuvable.`);
            }
            if (stocks[0].quantite_stock < ligne.quantite) {
                throw new Error(`Stock insuffisant pour le produit ${ligne.produit_id}.`);
            }
        }

        await connection.query(
            `INSERT INTO ventes (client_id, entreprise_id, montant_ttc)
             VALUES (?, ?, 0)`,
            [panierRows[0].client_id, entreprise_id]
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
                [id_ligne, facture_id, ligne.produit_id, ligne.quantite, ligne.prix_unitaire_ht]
            );
        }

        await recalculateVenteTotal(connection, facture_id);

        await connection.query(
            `UPDATE devis SET statut = 'converti' WHERE id_devis = ? AND entreprise_id = ?`,
            [id, entreprise_id]
        );

        await connection.commit();
        res.json({
            success: true,
            message: 'Panier converti en facture avec succes',
            facture: facture_id,
            id: facture_id,
            id_vente: facture_id,
            id_facture: facture_id,
            numero_facture: facture_id
        });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

// PUT /api/paniers/:id/annuler
export const annulerPanier = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;
    try {
        const [result] = await pool.query(
            `UPDATE devis
             SET statut = 'annule'
             WHERE id_devis = ? AND entreprise_id = ? AND statut = 'en_attente'`,
            [id, entreprise_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Panier non trouve ou deja traite' });
        }

        res.json({ success: true, message: 'Panier annule' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/paniers/:id
export const deletePanier = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;

    try {
        const [result] = await pool.query(
            `DELETE FROM devis WHERE id_devis = ? AND entreprise_id = ? AND statut = 'en_attente'`,
            [id, entreprise_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Panier non trouve ou deja traite' });
        }

        res.json({ success: true, message: 'Panier supprime' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
