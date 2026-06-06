# Backend CRM PME

Ce dossier contient le backend Node.js/Express de l'application CRM PME. Il expose une API REST pour gerer l'authentification, les clients, les produits, les categories, les fournisseurs, les paniers, les ventes, les paiements, les rapports, les notifications, les emails et les utilisateurs.

## Technologies utilisees

- Node.js avec modules ES (`type: module`).
- Express pour creer l'API HTTP.
- MySQL/MariaDB avec `mysql2/promise` pour acceder a la base de donnees.
- JWT avec `jsonwebtoken` pour securiser les routes.
- `bcryptjs` pour hasher les mots de passe.
- `cors` pour autoriser le frontend.
- `dotenv` pour charger les variables d'environnement.
- `nodemailer` pour envoyer les emails.

## Fichiers a la racine

- `.env.example`: exemple des variables d'environnement attendues par le backend.
- `package.json`: dependances npm et scripts (`npm start`, `npm run dev`).
- `package-lock.json`: verrouille les versions exactes des dependances installees.
- `dev-server.mjs`: lanceur de developpement.
- `DbQuincallerie.sql`: script SQL principal pour creer/importer la base de donnees.
- `patch_crm_pme_devis_ventes.sql`: patch SQL pour corriger certains triggers et la conversion panier/devis vers vente/facture.
- `documentation.md`: documentation generale courte du backend et du premier lancement.

## Dossiers

- `src`: code source de l'API.
- `src/config`: configuration technique, notamment la connexion MySQL.
- `src/controllers`: logique metier executee par les routes.
- `src/routes`: definition des endpoints API.
- `src/middleware`: traitements intermediaires Express comme l'authentification, l'audit et la gestion d'erreurs.
- `src/services`: services reutilisables pour les emails, notifications, audit et schema runtime.
- `docs`: documentation fonctionnelle et documentation des endpoints.

## Fonctionnement general

Le serveur demarre avec `src/server.js`. Il teste d'abord la connexion a la base de donnees, applique les petites migrations runtime via `schemaService`, puis lance Express.

`src/app.js` configure l'application Express: CORS, JSON, audit, routes API et endpoint de sante `/api/health`.

Les routes protegees utilisent un token JWT envoye avec:

```txt
Authorization: Bearer TOKEN
```

Les roles principaux sont:

- `manager`: gestion complete de l'entreprise.
- `caissier`: clients, paniers, ventes, paiements et certains rapports.
- `magasinier`: produits, categories, stock et inventaire.

## Variables importantes

- `PORT`: port HTTP du backend.
- `FRONTEND_URL`: origines autorisees par CORS, separees par des virgules.
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME`: connexion MySQL.
- `DB_SSL`: active SSL pour Aiven/Render avec `true`, `REQUIRED` ou `1`.
- `JWT_SECRET`, `JWT_EXPIRES_IN`: configuration des tokens.
- `BCRYPT_ROUNDS`: niveau de hashage des mots de passe.
- `EMAIL_USER`, `EMAIL_PASS`: compte Gmail utilise par `nodemailer`.
- `SETUP_CODE`: code optionnel pour proteger la premiere installation.

## Commandes utiles

```txt
npm install
npm run dev
npm start
```
