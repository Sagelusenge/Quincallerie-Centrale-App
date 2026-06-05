# Fonctionnement de l'application CRM PME

## Vision generale

CRM PME est une application de gestion commerciale destinee aux petites et moyennes entreprises. Le systeme gere les clients, les produits, le stock, les paniers, les ventes, les paiements, les rapports, les utilisateurs et les notifications.

L'application n'est pas un SaaS centralise. Chaque entreprise cliente recoit sa propre installation avec sa propre base de donnees. Une installation correspond donc a une seule entreprise.

## Mode d'installation par entreprise

Pour chaque nouvelle entreprise cliente:

1. Installer le backend.
2. Creer/importer la base de donnees avec `crm_pme.sql`.
3. Au premier lancement, afficher l'ecran de creation de l'entreprise.
4. L'entreprise renseigne ses informations et cree son manager.
5. Des que la creation reussit, l'ecran de creation disparait et l'application affiche uniquement le login.
6. Le manager se connecte et cree les autres utilisateurs internes.

Le setup est utilisable uniquement si aucune entreprise et aucun manager n'existent encore dans la base. Apres la premiere creation, le backend bloque toute nouvelle tentative de setup.

Pour eviter qu'une personne non autorisee cree l'entreprise avant le vrai client, l'installation peut definir `SETUP_CODE` dans `.env`. Dans ce cas, le front/mobile doit demander ce code sur l'ecran de premiere creation et l'envoyer au backend.

## Roles utilisateurs

Le systeme utilise trois roles:

`manager`: admin interne de l'entreprise. Il gere les utilisateurs, les clients, les produits, les paniers, les ventes, les paiements, les rapports et les mails.

`caissier`: utilisateur oriente vente/caisse. Il peut gerer les clients, paniers, ventes, paiements et consulter certains rapports.

`magasinier`: utilisateur oriente stock. Il peut gerer les produits, categories, approvisionnements, mouvements de stock et consulter les alertes/inventaires.

## Authentification

Les utilisateurs se connectent avec email et mot de passe via:

```txt
POST /api/auth/login
```

Le backend retourne un token JWT. Les applications mobile/front doivent ensuite envoyer ce token sur les routes protegees:

```txt
Authorization: Bearer {{TOKEN}}
```

Le token contient l'identite utilisateur, son role et l'identifiant de l'entreprise de l'installation.

## Premier lancement

Avant l'affichage des ecrans, le front/mobile doit verifier l'etat du setup:

```txt
GET /api/setup/status
```

Si `setup_available` vaut `true`, afficher l'ecran de creation de l'entreprise.

Si `setup_available` vaut `false`, afficher directement l'ecran de connexion.

La creation initiale se fait avec:

```txt
POST /api/setup/company
```

Si `SETUP_CODE` est defini dans `.env`, ajouter le code dans le body avec `setup_code` ou dans le header `X-Setup-Code`.

Cette operation cree:

- l'entreprise de l'installation;
- le premier manager;
- le mot de passe initial du manager.

Apres cela, `/api/setup/company` devient inaccessible et retourne une erreur `409`.

## Modules principaux

### Tableau de bord

Le dashboard donne les indicateurs importants:

- total clients;
- alertes stock;
- chiffre d'affaires du mois;
- paniers en attente;
- creances;
- ventes mensuelles;
- produits les plus vendus.

### Clients

Le module clients permet de creer, consulter, modifier et supprimer les clients. Il fournit aussi l'historique d'achat d'un client et son chiffre d'affaires.

### Categories et produits

Les categories classent les produits. Les produits contiennent la reference, le nom, la categorie, le prix, la TVA, la photo, le stock disponible et le seuil d'alerte.

Le stock diminue automatiquement lors d'une vente ou lors de la conversion d'un panier en facture. Il augmente via l'approvisionnement.

### Paniers

Un panier est cree pour un client avec une ou plusieurs lignes de produits. Un panier commence avec le statut `en_attente`.

Actions possibles:

- modifier un panier tant qu'il est en attente;
- annuler un panier en attente;
- convertir un panier en facture;
- supprimer un panier en attente.

Lors de la conversion, le systeme verifie le stock. Si le stock est suffisant, une facture est creee et le stock est diminue.

### Ventes et factures

Une vente represente une facture. Elle contient un client, des articles, les quantites, les prix et le montant total TTC.

Une facture peut etre modifiee ou supprimee seulement si aucun paiement n'a encore ete enregistre dessus.

### Paiements

Un paiement est lie a une facture. Le systeme refuse un paiement qui depasse le reste a payer.

Modes de paiement disponibles:

- `especes`;
- `carte`;
- `virement`;
- `mobile_money`.

Pour `mobile_money`, la reference externe et le numero du payeur sont requis.

### Rapports

Le backend expose des rapports pour:

- factures;
- creances;
- inventaire stock;
- meilleurs acheteurs;
- historique client.

### Notifications et emails

Les notifications internes servent aux alertes et demandes, par exemple recuperation de mot de passe.

Le module mail permet au manager:

- de verifier si l'envoi d'email est configure;
- de consulter les messages envoyes;
- d'envoyer un email;
- d'envoyer une notification a toute l'equipe.

## Format standard des reponses

Succes:

```json
{
  "success": true,
  "message": "Operation reussie",
  "data": {}
}
```

Erreur:

```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

## Demarrage backend

```txt
cd backend
npm install
npm run dev
```

Par defaut, l'API ecoute sur:

```txt
http://localhost:5000
```

## Variables d'environnement importantes

```txt
PORT=5000
FRONTEND_URL=http://localhost:5173

DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=crm_pme

JWT_SECRET=change-me
JWT_EXPIRES_IN=7d
SETUP_CODE=first-install-code

EMAIL_USER=
EMAIL_PASS=
```
