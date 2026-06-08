import pool from '../config/db.js';

const buildFournisseurId = (entrepriseId) => `FOU-${Date.now()}-${entrepriseId.slice(0, 8)}`;

export const getAllFournisseurs = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT f.*,
                    COUNT(m.id_mouvement) AS total_approvisionnements,
                    IFNULL(SUM(m.quantite), 0) AS quantite_totale_fournie
             FROM fournisseurs f
             LEFT JOIN mouvements_stock m
                    ON m.fournisseur_id = f.id_fournisseur
                   AND m.type_mouvement = 'entree'
             WHERE f.entreprise_id = ?
             GROUP BY f.id_fournisseur
             ORDER BY f.nom ASC`,
            [req.user.entreprise_id]
        );

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getFournisseurById = async (req, res) => {
    const { id } = req.params;

    try {
        const [fournisseurs] = await pool.query(
            `SELECT *
             FROM fournisseurs
             WHERE id_fournisseur = ? AND entreprise_id = ?`,
            [id, req.user.entreprise_id]
        );

        if (fournisseurs.length === 0) {
            return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
        }

        const [approvisionnements] = await pool.query(
            `SELECT m.id_mouvement, m.quantite, m.date_mouvement,
                    p.id_produit, p.nom AS produit_nom, p.reference_produit
             FROM mouvements_stock m
             JOIN produits p ON p.id_produit = m.produit_id
             WHERE m.fournisseur_id = ?
               AND p.entreprise_id = ?
               AND m.type_mouvement = 'entree'
             ORDER BY m.date_mouvement DESC
             LIMIT 50`,
            [id, req.user.entreprise_id]
        );

        res.json({
            success: true,
            data: {
                fournisseur: fournisseurs[0],
                approvisionnements
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createFournisseur = async (req, res) => {
    const { nom, telephone, email, adresse } = req.body;
    const entreprise_id = req.user.entreprise_id;

    if (!nom) {
        return res.status(400).json({ success: false, message: 'Nom du fournisseur requis' });
    }

    try {
        const id_fournisseur = buildFournisseurId(entreprise_id);

        await pool.query(
            `INSERT INTO fournisseurs
                (id_fournisseur, entreprise_id, nom, telephone, email, adresse)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id_fournisseur, entreprise_id, nom, telephone || null, email || null, adresse || null]
        );

        res.status(201).json({
            success: true,
            message: 'Fournisseur cree avec succes',
            data: { id_fournisseur, entreprise_id, nom, telephone, email, adresse }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateFournisseur = async (req, res) => {
    const { id } = req.params;
    const { nom, telephone, email, adresse, actif } = req.body;
    const actifValue = actif === undefined ? true : ['true', '1', 1, true].includes(actif);

    if (!nom) {
        return res.status(400).json({ success: false, message: 'Nom du fournisseur requis' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE fournisseurs
             SET nom = ?, telephone = ?, email = ?, adresse = ?, actif = ?
             WHERE id_fournisseur = ? AND entreprise_id = ?`,
            [
                nom,
                telephone || null,
                email || null,
                adresse || null,
                actifValue,
                id,
                req.user.entreprise_id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
        }

        res.json({ success: true, message: 'Fournisseur mis a jour' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteFournisseur = async (req, res) => {
    const { id } = req.params;

    try {
        const [mouvements] = await pool.query(
            `SELECT COUNT(*) AS total FROM mouvements_stock WHERE fournisseur_id = ?`,
            [id]
        );

        if (Number(mouvements[0].total) > 0) {
            const [result] = await pool.query(
                `UPDATE fournisseurs
                 SET actif = FALSE
                 WHERE id_fournisseur = ? AND entreprise_id = ?`,
                [id, req.user.entreprise_id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
            }

            return res.json({
                success: true,
                message: 'Fournisseur desactive car il possede deja des approvisionnements'
            });
        }

        const [result] = await pool.query(
            `DELETE FROM fournisseurs WHERE id_fournisseur = ? AND entreprise_id = ?`,
            [id, req.user.entreprise_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Fournisseur introuvable' });
        }

        res.json({ success: true, message: 'Fournisseur supprime' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
