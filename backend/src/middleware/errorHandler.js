// Gestion centralisée des erreurs
const errorHandler = (err, req, res, next) => {
    console.error('ERREUR: - errorHandler.js:3', err.message);

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Erreur interne du serveur',
    });
};

export default errorHandler;