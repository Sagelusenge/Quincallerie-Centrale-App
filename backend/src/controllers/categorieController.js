import pool from '../config/db.js';

export const getCategories = async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT c.*,
                    COUNT(p.id_produit) AS total_produits
             FROM categorie_produit c
             LEFT JOIN produits p ON p.categorie_id = c.id_categorie
             WHERE c.entreprise_id = ?
             GROUP BY c.id_categorie
             ORDER BY c.nom ASC`,
            [req.user.entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createCategorie = async (req, res) => {
    const { nom, description } = req.body;
    const entreprise_id = req.user.entreprise_id;

    if (!nom) {
        return res.status(400).json({ success: false, message: 'Nom de categorie requis' });
    }

    try {
        const id_categorie = `CAT-${Date.now()}-${entreprise_id.slice(0, 8)}`;

        await pool.query(
            `INSERT INTO categorie_produit (id_categorie, entreprise_id, nom, description)
             VALUES (?, ?, ?, ?)`,
            [id_categorie, entreprise_id, nom, description || null]
        );

        res.status(201).json({ success: true, message: 'Categorie creee', data: { id_categorie, nom, description } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateCategorie = async (req, res) => {
    const { id } = req.params;
    const { nom, description } = req.body;

    if (!nom) {
        return res.status(400).json({ success: false, message: 'Nom de categorie requis' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE categorie_produit SET nom = ?, description = ?
             WHERE id_categorie = ? AND entreprise_id = ?`,
            [nom, description || null, id, req.user.entreprise_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Categorie introuvable' });
        }

        res.json({ success: true, message: 'Categorie mise a jour' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteCategorie = async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query(
            `UPDATE produits SET categorie_id = NULL WHERE categorie_id = ? AND entreprise_id = ?`,
            [id, req.user.entreprise_id]
        );

        const [result] = await pool.query(
            `DELETE FROM categorie_produit WHERE id_categorie = ? AND entreprise_id = ?`,
            [id, req.user.entreprise_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Categorie introuvable' });
        }

        res.json({ success: true, message: 'Categorie supprimee' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
