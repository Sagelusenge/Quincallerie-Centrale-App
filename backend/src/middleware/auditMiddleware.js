import { logActivity } from '../services/auditService.js';

const auditMiddleware = (req, res, next) => {
    res.on('finish', () => {
        logActivity({ req, statusCode: res.statusCode });
    });
    next();
};

export default auditMiddleware;
