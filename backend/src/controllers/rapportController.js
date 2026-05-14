import pool from '../config/db.js';

export const getFactures = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT v.id_ventes, v.numero_facture, v.date_vente, v.montant_ttc,
                    c.id_client, c.nom AS client_nom, c.postnom AS client_postnom,
                    IFNULL(SUM(p.montant), 0) AS total_paye,
                    (v.montant_ttc - IFNULL(SUM(p.montant), 0)) AS reste_a_payer
             FROM ventes v
             JOIN client c ON c.id_client = v.client_id
             LEFT JOIN paiement p ON p.vente_id = v.id_ventes
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

export const getCreances = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT v.numero_facture, v.date_vente, c.nom AS client_nom,
                    v.montant_ttc AS montant_du,
                    IFNULL(SUM(p.montant), 0) AS montant_paye,
                    (v.montant_ttc - IFNULL(SUM(p.montant), 0)) AS reste_a_payer
             FROM ventes v
             JOIN client c ON c.id_client = v.client_id
             LEFT JOIN paiement p ON p.vente_id = v.id_ventes
             WHERE v.entreprise_id = ?
             GROUP BY v.id_ventes
             HAVING reste_a_payer > 0
             ORDER BY reste_a_payer DESC`,
            [entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getStockInventaire = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT id_produit, reference_produit, nom, prix_ht, quantite_stock,
                    seuil_alerte, (quantite_stock * prix_ht) AS valeur_stock_ht,
                    CASE
                        WHEN quantite_stock <= 0 THEN 'RUPTURE'
                        WHEN quantite_stock <= seuil_alerte THEN 'REAPPROVISIONNER'
                        ELSE 'OK'
                    END AS statut
             FROM produits
             WHERE entreprise_id = ?
             ORDER BY nom ASC`,
            [entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTopAcheteurs = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT c.id_client, c.nom, c.postnom,
                    COUNT(v.id_ventes) AS nombre_achats,
                    IFNULL(SUM(v.montant_ttc), 0) AS ca_total,
                    MAX(v.date_vente) AS derniere_visite
             FROM client c
             LEFT JOIN ventes v ON v.client_id = c.id_client
             WHERE c.entreprise_id = ?
             GROUP BY c.id_client
             ORDER BY ca_total DESC, nombre_achats DESC
             LIMIT 10`,
            [entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getHistoriqueClient = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT v.numero_facture, v.date_vente, p.nom AS produit_nom,
                    lv.quantite, lv.prix_unitaire_ht,
                    (lv.quantite * lv.prix_unitaire_ht * 1.16) AS total_ttc
             FROM client c
             JOIN ventes v ON v.client_id = c.id_client
             JOIN lignes_ventes lv ON lv.vente_id = v.id_ventes
             JOIN produits p ON p.id_produit = lv.produit_id
             WHERE c.id_client = ? AND c.entreprise_id = ? AND v.entreprise_id = ?
             ORDER BY v.date_vente DESC`,
            [id, entreprise_id, entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
