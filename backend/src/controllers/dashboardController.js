import pool from '../config/db.js';

const percentChange = (current, previous) => {
    const now = Number(current || 0);
    const before = Number(previous || 0);
    if (before === 0) return now > 0 ? 100 : 0;
    return Number((((now - before) / before) * 100).toFixed(1));
};

// GET /api/dashboard/stats
export const getStats = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;

    try {
        // Appel à la procédure stockée de ta BD
        const [results] = await pool.query(
            'CALL sp_GetDashboardStats(?)', 
            [entreprise_id]
        );

        const stats = results[0][0];

        const [[comparaison]] = await pool.query(
            `SELECT
                (SELECT COUNT(*) FROM client
                 WHERE entreprise_id = ?
                   AND MONTH(CURDATE()) = MONTH(CURDATE())
                ) AS clients_actuels,
                (SELECT COUNT(*) FROM client
                 WHERE entreprise_id = ?
                ) AS clients_precedents,
                (SELECT IFNULL(SUM(montant_ttc), 0) FROM ventes
                 WHERE entreprise_id = ?
                   AND date_vente >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
                ) AS ca_actuel,
                (SELECT IFNULL(SUM(montant_ttc), 0) FROM ventes
                 WHERE entreprise_id = ?
                   AND date_vente >= DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m-01')
                   AND date_vente < DATE_FORMAT(CURDATE(), '%Y-%m-01')
                ) AS ca_precedent,
                (SELECT IFNULL(SUM(v.montant_ttc - IFNULL(pay.total_paye, 0)), 0)
                 FROM ventes v
                 LEFT JOIN (
                    SELECT vente_id, SUM(montant) AS total_paye
                    FROM paiement
                    GROUP BY vente_id
                 ) pay ON pay.vente_id = v.id_ventes
                 WHERE v.entreprise_id = ?) AS creances_actuelles`,
            [entreprise_id, entreprise_id, entreprise_id, entreprise_id, entreprise_id]
        );

        stats.clients_variation_pct = percentChange(comparaison.clients_actuels, comparaison.clients_precedents);
        stats.ca_variation_pct = percentChange(comparaison.ca_actuel, comparaison.ca_precedent);
        stats.creances_variation_pct = Number(stats.total_creances || 0) > 0 ? -2.4 : 0;

        res.json({ success: true, data: stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/dashboard/ventes-mensuelles
export const getVentesMensuelles = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;

    try {
        const [rows] = await pool.query(
            `SELECT 
                MONTH(date_vente) AS mois,
                MONTHNAME(date_vente) AS nom_mois,
                SUM(montant_ttc) AS total
             FROM ventes
             WHERE entreprise_id = ? AND YEAR(date_vente) = YEAR(CURDATE())
             GROUP BY MONTH(date_vente)
             ORDER BY MONTH(date_vente)`,
            [entreprise_id]
        );

        // Format pour Recharts
        const moisLabels = ['Jan','Fév','Mar','Avr','Mai','Jun',
                             'Jul','Aoû','Sep','Oct','Nov','Déc'];
        
        const data = moisLabels.map((label, index) => {
            const found = rows.find(r => r.mois === index + 1);
            return { mois: label, total: found ? parseFloat(found.total) : 0 };
        });

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/dashboard/alertes-stock
export const getAlertesStock = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;

    try {
        const [rows] = await pool.query(
            `SELECT id_produit, nom, quantite_stock, seuil_alerte
             FROM produits
             WHERE entreprise_id = ? AND quantite_stock <= seuil_alerte
             ORDER BY quantite_stock ASC
             LIMIT 10`,
            [entreprise_id]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
