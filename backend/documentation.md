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
GET https://quincallerie-centrale-app.onrender.com/api/setup/status
```

Si `setup_available` vaut `true`, afficher l'ecran de creation de l'entreprise.

Si `setup_available` vaut `false`, afficher directement l'ecran de connexion.

Si `SETUP_CODE` est defini dans `.env`, l'ecran de creation doit demander ce code et l'envoyer avec la creation initiale.

Le statut du setup ne depend pas d'un token. Le backend regarde directement la base:

```txt
entreprise > 0 ou manager actif > 0
```

Si cette condition est vraie, l'installation est deja configuree et la creation initiale est bloquee.

## Creation initiale de l'entreprise

```txt
POST https://quincallerie-centrale-app.onrender.com/api/setup/company
Content-Type: application/json
```

```json
{
  "raison_sociale": "Entreprise Cliente SARL",
  "num_id_nationale": "CD-KIN-2026-001",
  "email_entreprise": "contact@client.local",
  "ville": "Kinshasa",
  "nom_manager": "kitsa",
  "email_manager": "sagelusenge@gmail.com",
  "mot_de_passe_manager": "Bonsoirs",
  "setup_code": "first-install-code"
}
```

Apres une creation reussie, `/api/setup/company` est verrouille et retourne `409` pour toute nouvelle tentative, meme si la requete est envoyee sans token.

## Authentification

```txt
POST https://quincallerie-centrale-app.onrender.com/api/auth/login
```

```json
{
  "email": "sagelusenge@gmail.com",
  "password": "Bonsoirs"
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
