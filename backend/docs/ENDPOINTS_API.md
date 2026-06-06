# Endpoints API - CRM PME

Base URL Render:

```txt
https://quincallerie-centrale-app.onrender.com
```

## Headers

Routes protegees:

```txt
Authorization: Bearer {{TOKEN}}
Content-Type: application/json
```

## Roles

```txt
manager
caissier
magasinier
```

## Auth

### Login

`POST /api/auth/login`

Public.

Body:

```json
{
  "email": "manager@client.local",
  "password": "Manager@2026"
}
```

Reponse:

```json
{
  "success": true,
  "message": "Connexion reussie",
  "token": "jwt",
  "user": {
    "id": "USR-00001",
    "nom": "Manager Principal",
    "email": "manager@client.local",
    "role": "manager",
    "entreprise_id": "ENT-CLI-0001",
    "entreprise_nom": "Entreprise Cliente",
    "type": "utilisateur"
  }
}
```

### Profil connecte

`GET /api/auth/me`

Roles: `manager`, `caissier`, `magasinier`.

### Changer son mot de passe

`POST /api/auth/change-password`

Roles: `manager`, `caissier`, `magasinier`.

Body:

```json
{
  "new_password": "Nouveau@123"
}
```

### Demander une recuperation

`POST /api/auth/forgot-password`

Public.

Body:

```json
{
  "email": "user@client.local",
  "motif": "Mot de passe oublie"
}
```

### Reinitialiser le mot de passe d'un utilisateur

`POST /api/auth/reset-request-password`

Roles: `manager`.

Body:

```json
{
  "email": "user@client.local",
  "new_password": "Temporaire@123"
}
```

## Setup initial

Ces endpoints servent au premier lancement de l'application. Le front/mobile doit afficher l'ecran de creation seulement si le setup n'est pas encore fait.

Une fois l'entreprise et le manager crees, le setup est verrouille definitivement pour cette base de donnees. Toute nouvelle tentative de creation retourne `409`.

Protection optionnelle: si `SETUP_CODE` est defini dans `.env`, le front/mobile doit envoyer ce code pendant la creation initiale, soit dans le body avec `setup_code`, soit dans le header `X-Setup-Code`.

### Statut setup

`GET /api/setup/status`

Public.

Reponse si le setup n'est pas encore fait:

```json
{
  "success": true,
  "data": {
    "configured": false,
    "setup_available": true,
    "locked": false,
    "entreprises": 0,
    "managers_actifs": 0
  }
}
```

Reponse si le setup est deja fait:

```json
{
  "success": true,
  "data": {
    "configured": true,
    "setup_available": false,
    "locked": true,
    "entreprises": 1,
    "managers_actifs": 1
  }
}
```

### Configurer entreprise + manager

`POST /api/setup/company`

Public uniquement avant la premiere configuration.

Header optionnel si `SETUP_CODE` est actif:

```txt
X-Setup-Code: {{SETUP_CODE}}
```

Body:

```json
{
  "id_entreprise": "ENT-CLI-0001",
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

`id_entreprise` est optionnel. Si absent, le backend genere un ID du type `ENT-XXX-0001`.

`setup_code` est requis seulement si `SETUP_CODE` est defini cote backend. Si le code est envoye dans le header `X-Setup-Code`, il n'est pas necessaire de le mettre dans le body.

Reponse si le code est incorrect:

```json
{
  "success": false,
  "message": "Code de premiere installation invalide."
}
```

Reponse si la configuration existe deja:

```json
{
  "success": false,
  "message": "Configuration deja effectuee. Accedez a la page de connexion."
}
```

## Dashboard

### Stats generales

`GET /api/dashboard/stats`

Roles: `manager`, `caissier`, `magasinier`.

### Ventes mensuelles

`GET /api/dashboard/ventes-mensuelles`

Roles: `manager`, `caissier`.

### Alertes stock

`GET /api/dashboard/alertes-stock`

Roles: `manager`, `magasinier`.

### Produits les plus vendus

`GET /api/dashboard/produits-plus-vendus`

Roles: `manager`, `caissier`, `magasinier`.

## Utilisateurs

### Liste

`GET /api/utilisateurs`

Roles: `manager`.

### Creer

`POST /api/utilisateurs`

Roles: `manager`.

Body:

```json
{
  "nom": "Jean Mukeba",
  "email": "jean@client.local",
  "mot_de_passe": "User@123",
  "role": "caissier"
}
```

Roles acceptes: `manager`, `caissier`, `magasinier`.

### Historique utilisateur

`GET /api/utilisateurs/:id/historique`

Roles: `manager`.

### Modifier

`PUT /api/utilisateurs/:id`

Roles: `manager`.

Body:

```json
{
  "nom": "Jean Mukeba",
  "email": "jean@client.local",
  "role": "magasinier",
  "mot_de_passe": "Optionnel@123"
}
```

`mot_de_passe` est optionnel.

### Activer/desactiver

`PUT /api/utilisateurs/:id/toggle`

Roles: `manager`.

### Supprimer

`DELETE /api/utilisateurs/:id`

Roles: `manager`.

Un manager ne peut pas supprimer son propre compte ni un autre manager.

## Clients

### Liste

`GET /api/clients`

Roles: `manager`, `caissier`.

### Detail + historique

`GET /api/clients/:id`

Roles: `manager`, `caissier`.

### Creer

`POST /api/clients`

Roles: `manager`, `caissier`.

Body:

```json
{
  "nom": "Kabasele",
  "postnom": "Mbuyi",
  "telephone": "+243810000000"
}
```

### Modifier

`PUT /api/clients/:id`

Roles: `manager`.

Body:

```json
{
  "nom": "Kabasele",
  "postnom": "Mbuyi",
  "telephone": "+243810000000"
}
```

### Supprimer

`DELETE /api/clients/:id`

Roles: `manager`.

## Categories

### Liste

`GET /api/categories`

Roles: `manager`, `caissier`, `magasinier`.

### Creer

`POST /api/categories`

Roles: `manager`, `magasinier`.

Body:

```json
{
  "reference_categorie": "OUTILLAGE",
  "nom": "Outillage",
  "description": "Outils et accessoires",
  "photo_url": "https://exemple.com/image.jpg"
}
```

`reference_categorie`, `description` et `photo_url` sont optionnels.

### Modifier

`PUT /api/categories/:id`

Roles: `manager`, `magasinier`.

### Supprimer

`DELETE /api/categories/:id`

Roles: `manager`.

## Fournisseurs

### Liste

`GET /api/fournisseurs`

Roles: `manager`, `magasinier`.

### Detail

`GET /api/fournisseurs/:id`

Roles: `manager`, `magasinier`.

Retourne le fournisseur et ses derniers approvisionnements.

### Creer

`POST /api/fournisseurs`

Roles: `manager`, `magasinier`.

Body:

```json
{
  "nom": "Quincaillerie Centrale Depot",
  "telephone": "+243000000000",
  "email": "fournisseur@example.com",
  "adresse": "Kinshasa"
}
```

Champ requis: `nom`.

### Modifier

`PUT /api/fournisseurs/:id`

Roles: `manager`, `magasinier`.

Body:

```json
{
  "nom": "Quincaillerie Centrale Depot",
  "telephone": "+243000000000",
  "email": "fournisseur@example.com",
  "adresse": "Kinshasa",
  "actif": true
}
```

### Supprimer

`DELETE /api/fournisseurs/:id`

Roles: `manager`.

Si le fournisseur possede deja des approvisionnements, il est desactive au lieu d'etre supprime pour conserver l'historique.

## Produits

### Liste

`GET /api/produits`

Roles: `manager`, `caissier`, `magasinier`.

### Mouvements recents

`GET /api/produits/mouvements-recents`

Roles: `manager`, `magasinier`.

### Creer

`POST /api/produits`

Roles: `manager`, `magasinier`.

Body:

```json
{
  "reference_produit": "VIS-10",
  "nom": "Vis 10mm",
  "categorie_id": "CAT-...",
  "photo_url": "https://exemple.com/vis.jpg",
  "prix_ht": 2.5,
  "taux_tva": 16,
  "quantite_stock": 100,
  "seuil_alerte": 10
}
```

Champs requis: `reference_produit`, `nom`, `prix_ht`.

### Modifier

`PUT /api/produits/:id`

Roles: `manager`, `magasinier`.

Body:

```json
{
  "nom": "Vis 10mm",
  "categorie_id": "CAT-...",
  "photo_url": "https://exemple.com/vis.jpg",
  "prix_ht": 2.5,
  "taux_tva": 16,
  "seuil_alerte": 10
}
```

### Approvisionner

`POST /api/produits/:id/approvisionner`

Roles: `manager`, `magasinier`.

Body:

```json
{
  "quantite": 50,
  "fournisseur_id": "FOU-..."
}
```

Champs requis: `quantite`, `fournisseur_id`.

### Supprimer

`DELETE /api/produits/:id`

Roles: `manager`.

## Paniers

### Liste

`GET /api/paniers`

Roles: `manager`, `caissier`.

### Detail

`GET /api/paniers/:id`

Roles: `manager`, `caissier`.

### Creer

`POST /api/paniers`

Roles: `manager`, `caissier`.

Body:

```json
{
  "client_id": "CLI-00001",
  "lignes": [
    {
      "produit_id": "PRD-VIS-ENT-CLI",
      "quantite": 2,
      "prix_unitaire_ht": 2.5
    }
  ]
}
```

`prix_unitaire_ht` est optionnel. Si absent, le prix du produit est utilise.

### Modifier

`PUT /api/paniers/:id`

Roles: `manager`, `caissier`.

Possible seulement si le panier est `en_attente`.

### Convertir en facture

`POST /api/paniers/:id/convertir`

Roles: `manager`, `caissier`.

Le backend verifie le stock puis cree une facture.

### Annuler

`PUT /api/paniers/:id/annuler`

Roles: `manager`.

### Supprimer

`DELETE /api/paniers/:id`

Roles: `manager`.

Possible seulement si le panier est `en_attente`.

## Ventes / factures

### Liste

`GET /api/ventes`

Roles: `manager`, `caissier`.

### Detail

`GET /api/ventes/:id`

Roles: `manager`, `caissier`.

### Creer

`POST /api/ventes`

Roles: `manager`, `caissier`.

Body:

```json
{
  "client_id": "CLI-00001",
  "articles": [
    {
      "produit_id": "PRD-VIS-ENT-CLI",
      "quantite": 2,
      "prix": 2.5
    }
  ]
}
```

`prix` est optionnel. Si absent, le prix du produit est utilise. Le backend verifie le stock.

### Modifier

`PUT /api/ventes/:id`

Roles: `manager`.

Possible seulement si la facture n'a aucun paiement.

### Supprimer

`DELETE /api/ventes/:id`

Roles: `manager`.

Possible seulement si la facture n'a aucun paiement.

## Paiements

### Enregistrer un paiement

`POST /api/paiements`

Roles: `manager`, `caissier`.

Body:

```json
{
  "vente_id": "FAC-2026-00001",
  "montant": 25,
  "mode_paiement": "mobile_money",
  "reference_externe": "MM-12345",
  "telephone_payeur": "+243810000000"
}
```

Modes acceptes: `especes`, `carte`, `virement`, `mobile_money`.

Pour `mobile_money`, `reference_externe` et `telephone_payeur` sont obligatoires.

### Rapport caisse journalier

`GET /api/paiements/rapport-caisse`

Roles: `manager`, `caissier`.

### Repartition des paiements

`GET /api/paiements/repartition`

Roles: `manager`, `caissier`.

## Rapports

### Factures

`GET /api/rapports/factures`

Roles: `manager`, `caissier`.

### Creances

`GET /api/rapports/creances`

Roles: `manager`, `caissier`.

### Stock inventaire

`GET /api/rapports/stock-inventaire`

Roles: `manager`, `magasinier`, `caissier`.

### Top acheteurs

`GET /api/rapports/top-acheteurs`

Roles: `manager`, `caissier`, `magasinier`.

### Historique client

`GET /api/rapports/historique-client/:id`

Roles: `manager`, `caissier`.

## Mail

### Statut mail

`GET /api/mail/status`

Roles: `manager`, `caissier`, `magasinier`.

### Messages envoyes

`GET /api/mail/messages`

Roles: `manager`.

### Envoyer un email

`POST /api/mail/send`

Roles: `manager`.

Body:

```json
{
  "to": "client@email.com",
  "subject": "Sujet",
  "message": "Contenu du message"
}
```

### Notifier toute l'equipe

`POST /api/mail/notify-team`

Roles: `manager`.

Body:

```json
{
  "subject": "Information importante",
  "message": "Message interne"
}
```

## Notifications

### Liste

`GET /api/notifications`

Roles: `manager`, `caissier`, `magasinier`.

### Marquer comme lue

`PUT /api/notifications/:id/read`

Roles: `manager`, `caissier`, `magasinier`.

## Health check

### Etat API

`GET /api/health`

Public.

Reponse:

```json
{
  "success": true,
  "message": "CRM PME API operationnelle"
}
```
