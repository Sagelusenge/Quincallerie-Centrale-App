import pool from '../config/db.js';

// GET /api/produits
export const getAllProduits = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT p.*, c.nom AS categorie_nom,
                CASE
                    WHEN p.quantite_stock <= 0 THEN 'RUPTURE'
                    WHEN p.quantite_stock <= p.seuil_alerte THEN 'ALERTE'
                    ELSE 'OK'
                END AS statut_stock
             FROM produits p
             LEFT JOIN categorie_produit c ON c.id_categorie = p.categorie_id
             WHERE p.entreprise_id = ?
             ORDER BY p.nom ASC`,
            [entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getMouvementsStock = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT m.id_mouvement, m.type_mouvement, m.quantite, m.date_mouvement,
                    p.nom AS produit_nom, p.reference_produit
             FROM mouvements_stock m
             JOIN produits p ON p.id_produit = m.produit_id
             WHERE p.entreprise_id = ?
             ORDER BY m.date_mouvement DESC
             LIMIT 8`,
            [entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/produits
export const createProduit = async (req, res) => {
    const { reference_produit, nom, categorie_id, photo_url, prix_ht, taux_tva, quantite_stock, seuil_alerte } = req.body;
    const entreprise_id = req.user.entreprise_id;

    if (!reference_produit || !nom || Number(prix_ht) <= 0) {
        return res.status(400).json({
            success: false,
            message: 'Reference, nom et prix positif requis'
        });
    }

    try {
        await pool.query(
            `INSERT INTO produits
             (reference_produit, nom, categorie_id, photo_url, prix_ht, taux_tva, quantite_stock, seuil_alerte, entreprise_id)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                reference_produit,
                nom,
                categorie_id || null,
                photo_url || null,
                Number(prix_ht),
                Number(taux_tva) || 16,
                Number(quantite_stock) || 0,
                Number(seuil_alerte) || 5,
                entreprise_id
            ]
        );
        res.status(201).json({ success: true, message: 'Produit cree avec succes' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/produits/:id
export const updateProduit = async (req, res) => {
    const { id } = req.params;
    const { nom, categorie_id, photo_url, prix_ht, taux_tva, seuil_alerte } = req.body;
    const entreprise_id = req.user.entreprise_id;

    if (!nom || Number(prix_ht) <= 0) {
        return res.status(400).json({ success: false, message: 'Nom et prix positif requis' });
    }

    try {
        const [result] = await pool.query(
            `UPDATE produits
             SET nom = ?, categorie_id = ?, photo_url = ?, prix_ht = ?, taux_tva = ?, seuil_alerte = ?
             WHERE id_produit = ? AND entreprise_id = ?`,
            [nom, categorie_id || null, photo_url || null, Number(prix_ht), Number(taux_tva) || 16, Number(seuil_alerte) || 5, id, entreprise_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Produit introuvable' });
        }

        res.json({ success: true, message: 'Produit mis a jour' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/produits/:id/approvisionner
export const approvisionner = async (req, res) => {
    const { id } = req.params;
    const { quantite } = req.body;
    const entreprise_id = req.user.entreprise_id;
    const quantiteNumber = Number(quantite);

    if (!Number.isFinite(quantiteNumber) || quantiteNumber <= 0) {
        return res.status(400).json({ success: false, message: 'Quantite positive requise' });
    }

    try {
        const [produits] = await pool.query(
            `SELECT id_produit FROM produits WHERE id_produit = ? AND entreprise_id = ?`,
            [id, entreprise_id]
        );

        if (produits.length === 0) {
            return res.status(404).json({ success: false, message: 'Produit introuvable dans votre entreprise' });
        }

        await pool.query('CALL sp_ApprovisionnerProduit(?, ?)', [id, quantiteNumber]);
        res.json({ success: true, message: `Stock mis a jour (+${quantiteNumber} unites)` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/produits/:id
export const deleteProduit = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;
    try {
        const [result] = await pool.query(
            'DELETE FROM produits WHERE id_produit = ? AND entreprise_id = ?',
            [id, entreprise_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Produit introuvable' });
        }

        res.json({ success: true, message: 'Produit supprime' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
