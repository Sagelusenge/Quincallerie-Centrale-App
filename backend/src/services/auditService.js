import pool from '../config/db.js';

const hiddenFields = new Set([
    'mot_de_passe',
    'password',
    'new_password',
    'old_password',
    'photo',
    'photo_url',
    'image',
    'image_url'
]);

const sanitizeValue = (value) => {
    if (Array.isArray(value)) return value.slice(0, 5).map(sanitizeValue);
    if (value && typeof value === 'object') {
        return Object.entries(value).reduce((acc, [key, item]) => {
            if (hiddenFields.has(key)) return acc;
            acc[key] = sanitizeValue(item);
            return acc;
        }, {});
    }
    if (typeof value === 'string' && value.length > 180) return `${value.slice(0, 180)}...`;
    return value;
};

const getEntityFromPath = (path) => {
    const cleanPath = path.replace(/^\/api\//, '');
    const segments = cleanPath.split('/').filter(Boolean);
    return {
        module: segments[0] || 'systeme',
        entityId: segments[1] || null,
        actionPath: segments
    };
};

const getActionLabel = (method, path) => {
    if (path.includes('/convertir')) return 'a converti un devis en facture';
    if (path.includes('/annuler')) return 'a annule un devis';
    if (path.includes('/toggle')) return 'a change le statut d’un utilisateur';
    if (path.includes('/approvisionner')) return 'a ajoute un approvisionnement';
    if (path.includes('/change-password')) return 'a change son mot de passe';
    if (path.includes('/reset-request-password')) return 'a reinitialise un mot de passe utilisateur';
    if (path.includes('/abonnement')) return 'a modifie un abonnement';
    if (path.includes('/mail/notify-team')) return 'a envoye une notification a toute l equipe';
    if (path.includes('/mail/send')) return 'a envoye un email';

    const moduleLabels = {
        clients: 'client',
        produits: 'produit',
        categories: 'categorie',
        devis: 'devis',
        ventes: 'facture',
        paiements: 'paiement',
        utilisateurs: 'utilisateur',
        'super-admin': 'espace super admin'
    };
    const { module } = getEntityFromPath(path);
    const label = moduleLabels[module] || module || 'element';

    if (method === 'POST') return `a ajoute un ${label}`;
    if (method === 'PUT' || method === 'PATCH') return `a modifie un ${label}`;
    if (method === 'DELETE') return `a supprime un ${label}`;
    return `a effectue une action sur ${label}`;
};

export const logActivity = async ({ req, statusCode }) => {
    if (!req.user || !req.user.id || !req.user.entreprise_id) return;
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return;
    if (statusCode < 200 || statusCode >= 300) return;

    const originalUrl = req.originalUrl || req.url || '';
    if (originalUrl.includes('/api/auth/login')) return;
    if (originalUrl.includes('/api/auth/forgot-password')) return;
    if (originalUrl.includes('/api/notifications/')) return;

    const { module, entityId } = getEntityFromPath(originalUrl.split('?')[0]);
    const metadata = sanitizeValue({
        params: req.params || {},
        body: req.body || {},
        query: req.query || {}
    });

    try {
        await pool.query(
            `INSERT INTO user_activity_logs
                (entreprise_id, user_id, user_name, user_role, action_type, module, entity_id, description, metadata)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                req.user.entreprise_id,
                req.user.id,
                req.user.nom || req.user.email || 'Utilisateur',
                req.user.role || req.user.type || 'utilisateur',
                req.method,
                module,
                entityId,
                getActionLabel(req.method, originalUrl),
                JSON.stringify(metadata)
            ]
        );
    } catch (error) {
        console.error('Erreur journal activite:', error.message);
    }
};
