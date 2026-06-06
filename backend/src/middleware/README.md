# Dossier middleware

Ce dossier contient les middlewares Express. Un middleware s'execute entre l'arrivee de la requete et le controller, ou juste apres la reponse.

## Fichiers

- `authMiddleware.js`: fournit `protect` pour verifier le token JWT et remplir `req.user`, puis `authorizeRoles` pour limiter une route a certains roles.
- `auditMiddleware.js`: declenche l'enregistrement automatique d'une activite apres les requetes reussies de modification (`POST`, `PUT`, `PATCH`, `DELETE`).
- `errorHandler.js`: gestionnaire centralise des erreurs Express. Il renvoie une reponse JSON standard avec `success: false`.

