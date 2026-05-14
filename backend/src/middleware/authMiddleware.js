import jwt from 'jsonwebtoken';

// ✅ Vérifie si l'utilisateur est connecté
export const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Accès refusé. Token manquant.' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token invalide ou expiré.' 
        });
    }
};

// ✅ Vérifie le rôle de l'utilisateur
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Accès interdit. Votre rôle (${req.user.role}) ne permet pas cette action.`,
                rolesAutorises: roles
            });
        }
        next();
    };
};

// ✅ Vérifie si c'est un Super Admin
export const protectSuperAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
            success: false, 
            message: 'Accès refusé. Token manquant.' 
        });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Vérifie que c'est bien un super admin
        if (decoded.type !== 'super_admin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Accès réservé aux Super Administrateurs.' 
            });
        }

        req.superAdmin = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token invalide ou expiré.' 
        });
    }
};