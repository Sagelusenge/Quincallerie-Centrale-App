import pool from '../config/db.js';

// GET /api/clients - Tous les clients de l'entreprise
export const getAllClients = async (req, res) => {
    const entreprise_id = req.user.entreprise_id;
    try {
        const [rows] = await pool.query(
            `SELECT c.*, 
                COUNT(v.id_ventes) AS nombre_achats,
                IFNULL(SUM(v.montant_ttc), 0) AS ca_total
             FROM client c
             LEFT JOIN ventes v ON c.id_client = v.client_id
             WHERE c.entreprise_id = ?
             GROUP BY c.id_client
             ORDER BY c.nom ASC`,
            [entreprise_id]
        );
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// GET /api/clients/:id - Un client et son historique
export const getClientById = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;
    try {
        // Infos du client
        const [clients] = await pool.query(
            'SELECT * FROM client WHERE id_client = ? AND entreprise_id = ?',
            [id, entreprise_id]
        );

        if (clients.length === 0) {
            return res.status(404).json({ success: false, message: 'Client non trouvé' });
        }

        // Historique des achats du client
        const [historique] = await pool.query(
            `SELECT v.numero_facture, v.date_vente, v.montant_ttc,
                    IFNULL(SUM(p.montant), 0) AS total_paye,
                    (v.montant_ttc - IFNULL(SUM(p.montant), 0)) AS reste
             FROM ventes v
             LEFT JOIN paiement p ON v.id_ventes = p.vente_id
             WHERE v.client_id = ? AND v.entreprise_id = ?
             GROUP BY v.id_ventes
             ORDER BY v.date_vente DESC`,
            [id, entreprise_id]
        );

        res.json({ 
            success: true, 
            data: { client: clients[0], historique } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// POST /api/clients - Créer un client
export const createClient = async (req, res) => {
    const { nom, postnom, telephone } = req.body;
    const entreprise_id = req.user.entreprise_id;

    if (!nom) {
        return res.status(400).json({ success: false, message: 'Le nom du client est requis' });
    }

    try {
        await pool.query(
            `INSERT INTO client (nom, postnom, telephone, entreprise_id) VALUES (?, ?, ?, ?)`,
            [nom, postnom || null, telephone || null, entreprise_id]
        );

        // Récupère le client créé avec son ID auto-généré
        const [newClient] = await pool.query(
            'SELECT * FROM client WHERE telephone = ? AND entreprise_id = ? ORDER BY id_client DESC LIMIT 1',
            [telephone, entreprise_id]
        );

        res.status(201).json({ 
            success: true, 
            message: 'Client créé avec succès', 
            data: newClient[0] 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// PUT /api/clients/:id - Modifier un client
export const updateClient = async (req, res) => {
    const { id } = req.params;
    const { nom, postnom, telephone } = req.body;
    const entreprise_id = req.user.entreprise_id;

    try {
        await pool.query(
            `UPDATE client SET nom = ?, postnom = ?, telephone = ?
             WHERE id_client = ? AND entreprise_id = ?`,
            [nom, postnom, telephone, id, entreprise_id]
        );
        res.json({ success: true, message: 'Client mis à jour' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// DELETE /api/clients/:id - Supprimer un client
export const deleteClient = async (req, res) => {
    const { id } = req.params;
    const entreprise_id = req.user.entreprise_id;

    try {
        await pool.query(
            'DELETE FROM client WHERE id_client = ? AND entreprise_id = ?',
            [id, entreprise_id]
        );
        res.json({ success: true, message: 'Client supprimé' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};