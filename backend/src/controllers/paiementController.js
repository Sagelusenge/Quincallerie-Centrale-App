import pool from '../config/db.js';

// POST /api/paiements
export const createPaiement = async (req, res) => {
    const { vente_id, montant, mode_paiement, reference_externe, telephone_payeur } = req.body;
    const entreprise_id = req.user.entreprise_id;
    const montantNumber = Number(montant);
    const reference = String(reference_externe || '').trim();
    const telephone = String(telephone_payeur || '').trim();

    if (!vente_id || !Number.isFinite(montantNumber) || montantNumber <= 0 || !mode_paiement) {
        return res.status(400).json({ success: false, message: 'Donnees paiement incompletes ou invalides' });
    }

    if (mode_paiement === 'mobile_money' && (!reference || !telephone)) {
        return res.status(400).json({ success: false, message: 'Reference et numero requis pour Mobile Money' });
    }

    try {
        const [ventes] = await pool.query(
            `SELECT v.id_ventes,
                    COALESCE(NULLIF(v.montant_ttc, 0), IFNULL(line_totals.total_ttc, 0)) AS montant_ttc,
                    IFNULL(pay.total_paye, 0) AS total_paye
             FROM ventes v
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
             WHERE v.id_ventes = ? AND v.entreprise_id = ?
             GROUP BY v.id_ventes, line_totals.total_ttc, pay.total_paye`,
            [vente_id, entreprise_id]
        );

        if (ventes.length === 0) {
            return res.status(404).json({ success: false, message: 'Facture introuvable dans votre entreprise' });
        }

        const reste = Number(ventes[0].montant_ttc) - Number(ventes[0].total_paye);
        if (montantNumber > reste) {
            return res.status(400).json({
                success: false,
                message: `Le paiement depasse le reste a payer (${reste.toFixed(2)} CDF).`
            });
        }

        await pool.query('CALL sp_EnregistrerPaiement(?, ?, ?, ?, ?)', [
            vente_id,
            montantNumber,
            mode_paiement,
            reference || null,
            telephone || null
        ]);

        res.status(201).json({
            success: true,
            message: `Paiement de ${montantNumber} CDF enregistre (${mode_paiement})`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/paiements/rapport-caisse
export const getRapportCaisse = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT p.id_paiement,
                    p.vente_id,
                    COALESCE(v.numero_facture, v.id_ventes) AS facture,
                    p.montant,
                    p.mode_paiement,
                    p.reference_externe,
                    p.telephone_payeur,
                    p.date_paiement,
                    c.nom AS client_nom,
                    c.postnom AS client_postnom,
                    TRIM(CONCAT(c.nom, ' ', IFNULL(c.postnom, ''))) AS client_nom_complet
             FROM paiement p
             JOIN ventes v ON v.id_ventes = p.vente_id
             JOIN client c ON c.id_client = v.client_id
             WHERE v.entreprise_id = ?
             ORDER BY p.date_paiement DESC
             LIMIT 100`,
            [entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getRepartitionPaiements = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT p.mode_paiement,
                    COUNT(*) AS transactions,
                    IFNULL(SUM(p.montant), 0) AS total
             FROM paiement p
             JOIN ventes v ON v.id_ventes = p.vente_id
             WHERE v.entreprise_id = ?
             GROUP BY p.mode_paiement
             ORDER BY total DESC`,
            [entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
