# CRM PME - Backend mono-installation

Ce backend est concu pour etre installe separement chez chaque entreprise cliente.

La logique n'est pas SaaS: une installation = une base de donnees = une entreprise.

## Initialisation

```txt
mysql -u root -p < backend/crm_pme.sql
cd backend
npm install
npm run dev
```

## Premier lancement

Au premier lancement, l'application doit appeler:

```txt
GET http://localhost:5000/api/setup/status
```

Si `setup_available` vaut `true`, afficher l'ecran de creation de l'entreprise.

Si `setup_available` vaut `false`, afficher directement l'ecran de connexion.

Si `SETUP_CODE` est defini dans `.env`, l'ecran de creation doit demander ce code et l'envoyer avec la creation initiale.

## Creation initiale de l'entreprise

```txt
POST http://localhost:5000/api/setup/company
Content-Type: application/json
```

```json
{
  "raison_sociale": "Entreprise Cliente SARL",
  "num_id_nationale": "CD-KIN-2026-001",
  "email_entreprise": "contact@client.local",
  "ville": "Kinshasa",
  "nom_manager": "Manager Principal",
  "email_manager": "manager@client.local",
  "mot_de_passe_manager": "Manager@2026",
  "setup_code": "first-install-code"
}
```

Apres une creation reussie, `/api/setup/company` est verrouille et retourne `409` pour toute nouvelle tentative.

## Authentification

```txt
POST http://localhost:5000/api/auth/login
```

```json
{
  "email": "manager@client.local",
  "password": "Manager@2026"
}
```

Toutes les routes protegees utilisent ensuite:

```txt
Authorization: Bearer {{TOKEN}}
```

## Documentation complete

La documentation fonctionnelle se trouve ici:

```txt
backend/docs/FONCTIONNEMENT_APPLICATION.md
```

La documentation des endpoints pour les devs mobile/front se trouve ici:

```txt
backend/docs/ENDPOINTS_API.md
```
