# Dossier src

Ce dossier contient tout le code source du backend Express.

## Fichiers principaux

- `app.js`: cree et configure l'application Express. Il active CORS, `express.json`, le middleware d'audit, toutes les routes API et le gestionnaire d'erreurs.
- `server.js`: point d'entree du serveur. Il charge les variables d'environnement, teste la connexion MySQL, applique le schema runtime, puis demarre l'ecoute HTTP.

## Sous-dossiers

- `config`: configuration partagee, surtout la connexion a la base de donnees.
- `controllers`: fonctions qui contiennent la logique metier de chaque module.
- `middleware`: fonctions Express executees avant ou apres les routes.
- `routes`: declaration des URLs et liaison entre endpoints, middlewares et controllers.
- `services`: fonctions reutilisables appelees par plusieurs controllers ou middlewares.

## Flux d'une requete

1. La requete arrive dans `app.js`.
2. Express applique CORS, JSON et audit.
3. La route correspondante dans `routes` est appelee.
4. Les middlewares verifient le token et le role si necessaire.
5. Le controller execute la logique metier et interagit avec MySQL via `config/db.js`.
6. La reponse JSON est retournee au client.

