import pool from '../config/db.js';
import PDFDocument from 'pdfkit';

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

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('fr-FR')} CDF`;

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

const getVenteDetails = async (id, entreprise_id) => {
    const [ventes] = await pool.query(
        `SELECT v.*,
                COALESCE(v.numero_facture, v.id_ventes) AS id_vente,
                COALESCE(v.numero_facture, v.id_ventes) AS id_facture,
                COALESCE(NULLIF(v.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) AS montant_ttc,
                COALESCE(NULLIF(v.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) AS montant_total_ttc,
                COALESCE(NULLIF(v.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) AS total_ttc,
                c.nom AS client_nom,
                c.postnom AS client_postnom,
                TRIM(CONCAT(c.nom, ' ', IFNULL(c.postnom, ''))) AS client_nom_complet,
                c.telephone AS client_tel,
                IFNULL(pay.total_paye, 0) AS total_paye,
                (COALESCE(NULLIF(v.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) - IFNULL(pay.total_paye, 0)) AS reste_a_payer,
                e.raison_sociale AS entreprise_nom, e.ville
         FROM ventes v
         JOIN client c ON v.client_id = c.id_client
         JOIN entreprise e ON v.entreprise_id = e.id_entreprise
         LEFT JOIN (
            SELECT vente_id, SUM(montant) AS total_paye
            FROM paiement
            GROUP BY vente_id
         ) pay ON pay.vente_id = v.id_ventes
         LEFT JOIN (
            SELECT vente_id, SUM(quantite * prix_unitaire_ht) * 1.16 AS total_ttc
            FROM lignes_ventes
            GROUP BY vente_id
         ) line_totals ON line_totals.vente_id = v.id_ventes
         WHERE v.id_ventes = ? AND v.entreprise_id = ?`,
        [id, entreprise_id]
    );

    if (ventes.length === 0) {
        return null;
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

    return { ...ventes[0], lignes, paiements };
};

// GET /api/ventes
export const getAllVentes = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT v.*,
                    COALESCE(v.numero_facture, v.id_ventes) AS id_vente,
                    COALESCE(v.numero_facture, v.id_ventes) AS id_facture,
                    c.nom AS client_nom,
                    c.postnom AS client_postnom,
                    TRIM(CONCAT(c.nom, ' ', IFNULL(c.postnom, ''))) AS client_nom_complet,
                    IFNULL(pay.total_paye, 0) AS total_paye,
                    COALESCE(NULLIF(v.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) AS montant_ttc,
                    COALESCE(NULLIF(v.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) AS montant_total_ttc,
                    COALESCE(NULLIF(v.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) AS total_ttc,
                    (COALESCE(NULLIF(v.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) - IFNULL(pay.total_paye, 0)) AS reste_a_payer,
                    CASE
                        WHEN IFNULL(pay.total_paye, 0) >= COALESCE(NULLIF(v.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) THEN 'paye'
                        WHEN IFNULL(pay.total_paye, 0) > 0 THEN 'partiel'
                        ELSE 'impaye'
                    END AS statut_paiement
             FROM ventes v
             JOIN client c ON v.client_id = c.id_client
             LEFT JOIN (
                SELECT vente_id, SUM(montant) AS total_paye
                FROM paiement
                GROUP BY vente_id
             ) pay ON pay.vente_id = v.id_ventes
             LEFT JOIN (
                SELECT vente_id, SUM(quantite * prix_unitaire_ht) * 1.16 AS total_ttc
                FROM lignes_ventes
                GROUP BY vente_id
             ) line_totals ON line_totals.vente_id = v.id_ventes
             WHERE v.entreprise_id = ?
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
        const vente = await getVenteDetails(id, entreprise_id);

        if (!vente) {
            return res.status(404).json({ success: false, message: 'Vente non trouvee' });
        }

        res.json({
            success: true,
            data: vente
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/ventes/:id/pdf
export const getVentePdf = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;

    try {
        const vente = await getVenteDetails(id, entreprise_id);

        if (!vente) {
            return res.status(404).json({ success: false, message: 'Vente non trouvee' });
        }

        const factureId = vente.numero_facture || vente.id_vente || vente.id_facture || vente.id_ventes || id;
        const doc = new PDFDocument({ size: 'A4', margin: 48 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="facture-${factureId}.pdf"`);

        doc.pipe(res);

        doc.fontSize(20).font('Helvetica-Bold').text('Quincaillerie Centrale', { align: 'left' });
        doc.moveDown(0.2);
        doc.fontSize(10).font('Helvetica').text(vente.ville || '');
        doc.moveDown(1.2);

        doc.fontSize(16).font('Helvetica-Bold').text(`Facture ${factureId}`);
        doc.fontSize(10).font('Helvetica').text(`Date: ${new Date(vente.date_vente).toLocaleDateString('fr-FR')}`);
        doc.moveDown();

        doc.font('Helvetica-Bold').text('Client');
        doc.font('Helvetica').text(vente.client_nom_complet || vente.client_nom || '-');
        if (vente.client_tel) doc.text(vente.client_tel);
        doc.moveDown(1.2);

        const startY = doc.y;
        const columns = {
            produit: 48,
            quantite: 300,
            prix: 370,
            total: 470
        };

        doc.font('Helvetica-Bold').fontSize(10);
        doc.text('Produit', columns.produit, startY);
        doc.text('Qte', columns.quantite, startY, { width: 45, align: 'right' });
        doc.text('Prix HT', columns.prix, startY, { width: 80, align: 'right' });
        doc.text('Total TTC', columns.total, startY, { width: 80, align: 'right' });
        doc.moveTo(48, startY + 16).lineTo(550, startY + 16).stroke();

        doc.font('Helvetica').fontSize(10);
        let y = startY + 28;
        for (const ligne of vente.lignes) {
            if (y > 730) {
                doc.addPage();
                y = 48;
            }

            doc.text(ligne.produit_nom || '-', columns.produit, y, { width: 230 });
            doc.text(String(ligne.quantite || 0), columns.quantite, y, { width: 45, align: 'right' });
            doc.text(formatCurrency(ligne.prix_unitaire_ht), columns.prix, y, { width: 80, align: 'right' });
            doc.text(formatCurrency(ligne.total_ttc), columns.total, y, { width: 80, align: 'right' });
            y += 24;
        }

        doc.moveTo(48, y).lineTo(550, y).stroke();
        y += 18;
        doc.font('Helvetica-Bold').fontSize(12);
        doc.text('Montant total a payer', 315, y, { width: 135, align: 'right' });
        doc.text(formatCurrency(vente.montant_ttc), 470, y, { width: 80, align: 'right' });

        if (Number(vente.total_paye || 0) > 0) {
            y += 18;
            doc.font('Helvetica').fontSize(10);
            doc.text('Total paye', 315, y, { width: 135, align: 'right' });
            doc.text(formatCurrency(vente.total_paye), 470, y, { width: 80, align: 'right' });
            y += 16;
            doc.font('Helvetica-Bold').fontSize(11);
            doc.text('Reste a payer', 315, y, { width: 135, align: 'right' });
            doc.text(formatCurrency(vente.reste_a_payer), 470, y, { width: 80, align: 'right' });
        }

        doc.moveDown(3);
        doc.font('Helvetica').fontSize(9).fillColor('#64748b').text('Merci pour votre achat.', 48, doc.y);

        doc.end();
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: error.message });
        } else {
            res.end();
        }
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

        await recalculateVenteTotal(connection, facture_id);

        await connection.commit();

        res.status(201).json({
            success: true,
            message: 'Vente enregistree avec succes',
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

        await recalculateVenteTotal(connection, id);

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
