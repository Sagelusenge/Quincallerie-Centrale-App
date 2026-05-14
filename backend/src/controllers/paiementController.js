import pool from '../config/db.js';

// POST /api/paiements
export const createPaiement = async (req, res) => {
    const { vente_id, montant, mode_paiement, reference_externe, telephone_payeur } = req.body;
    const entreprise_id = req.user.entreprise_id;
    const montantNumber = Number(montant);

    if (!vente_id || !Number.isFinite(montantNumber) || montantNumber <= 0 || !mode_paiement) {
        return res.status(400).json({ success: false, message: 'Donnees paiement incompletes ou invalides' });
    }

    try {
        const [ventes] = await pool.query(
            `SELECT v.id_ventes, v.montant_ttc, IFNULL(SUM(p.montant), 0) AS total_paye
             FROM ventes v
             LEFT JOIN paiement p ON p.vente_id = v.id_ventes
             WHERE v.id_ventes = ? AND v.entreprise_id = ?
             GROUP BY v.id_ventes`,
            [vente_id, entreprise_id]
        );

        if (ventes.length === 0) {
            return res.status(404).json({ success: false, message: 'Facture introuvable dans votre entreprise' });
        }

        const reste = Number(ventes[0].montant_ttc) - Number(ventes[0].total_paye);
        if (montantNumber > reste) {
            return res.status(400).json({
                success: false,
                message: `Le paiement depasse le reste a payer (${reste.toFixed(2)} USD).`
            });
        }

        await pool.query('CALL sp_EnregistrerPaiement(?, ?, ?, ?, ?)', [
            vente_id,
            montantNumber,
            mode_paiement,
            reference_externe || null,
            telephone_payeur || null
        ]);

        res.status(201).json({
            success: true,
            message: `Paiement de ${montantNumber} USD enregistre (${mode_paiement})`
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
            `SELECT * FROM v_rapport_caisse_journalier WHERE entreprise_id = ?`,
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
