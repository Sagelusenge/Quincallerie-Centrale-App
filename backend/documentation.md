Je vois dans ta BD que tu as déjà des données. Voici la suite étape par étape.

---

## ÉTAPE 1 — Créer une entreprise + manager

### Route
```txt
POST http://localhost:5000/api/super-admin/entreprises
```

### Headers
```txt
Authorization: Bearer {{SUPER_ADMIN_TOKEN}}
Content-Type: application/json
```

### Body JSON
```json
{
    "raison_sociale": "Sokina SARL",
    "email_entreprise": "contact@sokina.com",
    "num_id_nationale": "CD-KIN-2025-001",
    "ville": "Kinshasa",
    "nom_manager": "Jean Mukeba",
    "email_manager": "manager@sokina.com",
    "mdp_manager": "Manager@123"
}
```

### Réponse attendue
```json
{
    "success": true,
    "message": "Entreprise Sokina SARL créée avec son manager",
    "data": {
        "id_entreprise": "ENT-SOK-0001",
        "email_manager": "manager@sokina.com",
        "role": "manager"
    }
}
```

---

## ÉTAPE 2 — Vérifier que l'entreprise est créée

### Route
```txt
GET http://localhost:5000/api/super-admin/entreprises
```

### Headers
```txt
Authorization: Bearer {{SUPER_ADMIN_TOKEN}}
```

### Réponse attendue
```json
{
    "success": true,
    "data": [
        {
            "id_entreprise": "ENT-SOK-0001",
            "raison_sociale": "Sokina SARL",
            "email": "contact@sokina.com",
            "ville": "Kinshasa",
            "statut_abonnement": "actif",
            "date_expiration_abonnement": "2025-05-25",
            "jours_restants": 30,
            "nb_employes": 1,
            "nb_ventes": 0,
            "ca_total": 0
        }
    ]
}
```

---

## ÉTAPE 3 — Login Manager

### Route
```txt
POST http://localhost:5000/api/auth/login
```

### Body JSON
```json
{
    "email": "manager@sokina.com",
    "password": "Manager@123"
}
```

### Réponse attendue
```json
{
    "success": true,
    "message": "Connexion réussie",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
    "user": {
        "id": "USR-00001",
        "nom": "Jean Mukeba",
        "email": "manager@sokina.com",
        "role": "manager",
        "entreprise_id": "ENT-SOK-0001",
        "type": "utilisateur"
    }
}
```

### Important
```txt
Copier ce token — il sera utilisé pour toutes 
les routes suivantes
```

---

## ÉTAPE 4 — Vérifier le profil connecté

### Route
```txt
GET http://localhost:5000/api/auth/me
```

### Headers
```txt
Authorization: Bearer {{TOKEN_MANAGER}}
```

### Réponse attendue
```json
{
    "success": true,
    "user": {
        "id_utilisateur": "USR-00001",
        "nom": "Jean Mukeba",
        "email": "manager@sokina.com",
        "role": "manager",
        "entreprise_id": "ENT-SOK-0001",
        "entreprise_nom": "Sokina SARL"
    }
}
```

---

## ÉTAPE 5 — Créer les produits

### Route
```txt
POST http://localhost:5000/api/produits
```

### Headers
```txt
Authorization: Bearer {{TOKEN_MANAGER}}
Content-Type: application/json
```

### Produit 1
```json
{
    "reference_produit": "LAP-001",
    "nom": "Laptop Dell Inspiron 15",
    "prix_ht": 750,
    "taux_tva": 16,
    "quantite_stock": 20,
    "seuil_alerte": 3
}
```

### Produit 2
```json
{
    "reference_produit": "PHN-001",
    "nom": "Samsung Galaxy A54",
    "prix_ht": 320,
    "taux_tva": 16,
    "quantite_stock": 15,
    "seuil_alerte": 5
}
```

### Produit 3
```json
{
    "reference_produit": "ACC-001",
    "nom": "Souris Logitech M185",
    "prix_ht": 15,
    "taux_tva": 16,
    "quantite_stock": 2,
    "seuil_alerte": 5
}
```

### Réponse attendue
```json
{
    "success": true,
    "message": "Produit créé avec succès"
}
```

---

## ÉTAPE 6 — Vérifier les produits

### Route
```txt
GET http://localhost:5000/api/produits
```

### Headers
```txt
Authorization: Bearer {{TOKEN_MANAGER}}
```

### Réponse attendue
```json
{
    "success": true,
    "data": [
        {
            "id_produit": "PRD-ACC-001-ENT-SOK",
            "reference_produit": "ACC-001",
            "nom": "Souris Logitech M185",
            "prix_ht": 15,
            "taux_tva": 16,
            "quantite_stock": 2,
            "seuil_alerte": 5,
            "statut_stock": "ALERTE"
        },
        {
            "id_produit": "PRD-LAP-001-ENT-SOK",
            "reference_produit": "LAP-001",
            "nom": "Laptop Dell Inspiron 15",
            "prix_ht": 750,
            "taux_tva": 16,
            "quantite_stock": 20,
            "seuil_alerte": 3,
            "statut_stock": "OK"
        },
        {
            "id_produit": "PRD-PHN-001-ENT-SOK",
            "reference_produit": "PHN-001",
            "nom": "Samsung Galaxy A54",
            "prix_ht": 320,
            "taux_tva": 16,
            "quantite_stock": 15,
            "seuil_alerte": 5,
            "statut_stock": "OK"
        }
    ]
}
```

---

## ÉTAPE 7 — Créer les clients

### Route
```txt
POST http://localhost:5000/api/clients
```

### Headers
```txt
Authorization: Bearer {{TOKEN_MANAGER}}
Content-Type: application/json
```

### Client 1
```json
{
    "nom": "Kalala",
    "postnom": "Mutombo",
    "telephone": "+243810000001"
}
```

### Client 2
```json
{
    "nom": "Mbuyi",
    "postnom": "Tshisekedi",
    "telephone": "+243820000002"
}
```

### Client 3 — Sans téléphone
```json
{
    "nom": "Client Comptoir"
}
```

### Réponse attendue
```json
{
    "success": true,
    "message": "Client créé avec succès",
    "data": {
        "id_client": "CLI-00001",
        "nom": "Kalala",
        "postnom": "Mutombo",
        "telephone": "+243810000001",
        "entreprise_id": "ENT-SOK-0001"
    }
}
```

---

## ÉTAPE 8 — Vérifier les clients

### Route
```txt
GET http://localhost:5000/api/clients
```

### Headers
```txt
Authorization: Bearer {{TOKEN_MANAGER}}
```

---

## ÉTAPE 9 — Créer un devis

### Route
```txt
POST http://localhost:5000/api/devis
```

### Headers
```txt
Authorization: Bearer {{TOKEN_MANAGER}}
Content-Type: application/json
```

### Body JSON
```json
{
    "client_id": "CLI-00001",
    "lignes": [
        {
            "produit_id": "PRD-LAP-001-ENT-SOK",
            "quantite": 1,
            "prix_unitaire_ht": 750
        },
        {
            "produit_id": "PRD-PHN-001-ENT-SOK",
            "quantite": 2,
            "prix_unitaire_ht": 320
        }
    ]
}
```

### Réponse attendue
```json
{
    "success": true,
    "message": "Devis créé avec succès",
    "id_devis": "DEV-00001"
}
```

---

## ÉTAPE 10 — Convertir le devis en facture

### Route
```txt
POST http://localhost:5000/api/devis/DEV-00001/convertir
```

### Headers
```txt
Authorization: Bearer {{TOKEN_MANAGER}}
```

### Body JSON
```json
{}
```

### Réponse attendue
```json
{
    "success": true,
    "message": "Devis converti en facture avec succès"
}
```

### Effets automatiques en BD
```txt
✅ Facture créée dans ventes
✅ Lignes copiées dans lignes_ventes
✅ Stock diminué automatiquement
✅ Statut devis → converti
```

---

## ÉTAPE 11 — Créer une vente directe

### Route
```txt
POST http://localhost:5000/api/ventes
```

### Headers
```txt
Authorization: Bearer {{TOKEN_MANAGER}}
Content-Type: application/json
```

### Body JSON
```json
{
    "client_id": "CLI-00002",
    "articles": [
        {
            "id": "PRD-ACC-001-ENT-SOK",
            "qte": 1,
            "prix": 15
        }
    ]
}
```

### Réponse attendue
```json
{
    "success": true,
    "message": "Vente enregistrée avec succès",
    "facture": "FAC-2025-00002",
    "id": "FAC-2025-00002"
}
```

---

## ÉTAPE 12 — Voir toutes les ventes

### Route
```txt
GET http://localhost:5000/api/ventes
```

### Headers
```txt
Authorization: Bearer {{TOKEN_MANAGER}}
```

---

## ÉTAPE 13 — Enregistrer un paiement

### Route
```txt
POST http://localhost:5000/api/paiements
```

### Headers
```txt
Authorization: Bearer {{TOKEN_MANAGER}}
Content-Type: application/json
```

### Paiement espèces
```json
{
    "vente_id": "FAC-2025-00001",
    "montant": 500,
    "mode_paiement": "especes"
}
```

### Paiement Mobile Money
```json
{
    "vente_id": "FAC-2025-00001",
    "montant": 750,
    "mode_paiement": "mobile_money",
    "reference_externe": "MM-TXN-20250425-001",
    "telephone_payeur": "+243810000001"
}
```

### Réponse attendue
```json
{
    "success": true,
    "message": "Paiement de 500 USD enregistré (especes)"
}
```

---

## ÉTAPE 14 — Rapport caisse du jour

### Route
```txt
GET http://localhost:5000/api/paiements/rapport-caisse
```

### Headers
```txt
Authorization: Bearer {{TOKEN_MANAGER}}
```

---

## ÉTAPE 15 — Dashboard

### Stats principales
```txt
GET http://localhost:5000/api/dashboard/stats
Authorization: Bearer {{TOKEN_MANAGER}}
```

### Ventes mensuelles
```txt
GET http://localhost:5000/api/dashboard/ventes-mensuelles
Authorization: Bearer {{TOKEN_MANAGER}}
```

### Alertes stock
```txt
GET http://localhost:5000/api/dashboard/alertes-stock
Authorization: Bearer {{TOKEN_MANAGER}}
```

---

## ÉTAPE 16 — Rapports

### Factures
```txt
GET http://localhost:5000/api/rapports/factures
Authorization: Bearer {{TOKEN_MANAGER}}
```

### Créances
```txt
GET http://localhost:5000/api/rapports/creances
Authorization: Bearer {{TOKEN_MANAGER}}
```

### Inventaire stock
```txt
GET http://localhost:5000/api/rapports/stock-inventaire
Authorization: Bearer {{TOKEN_MANAGER}}
```

### Top acheteurs
```txt
GET http://localhost:5000/api/rapports/top-acheteurs
Authorization: Bearer {{TOKEN_MANAGER}}
```

### Historique client
```txt
GET http://localhost:5000/api/rapports/historique-client/CLI-00001
Authorization: Bearer {{TOKEN_MANAGER}}
```

---

## ÉTAPE 17 — Créer les autres utilisateurs

### Caissier
```txt
POST http://localhost:5000/api/utilisateurs
Authorization: Bearer {{TOKEN_MANAGER}}
```
```json
{
    "nom": "Marie Kabila",
    "email": "caissier@sokina.com",
    "mot_de_passe": "Caissier@123",
    "role": "caissier"
}
```

### Magasinier
```txt
POST http://localhost:5000/api/utilisateurs
Authorization: Bearer {{TOKEN_MANAGER}}
```
```json
{
    "nom": "Pierre Nkusu",
    "email": "magasinier@sokina.com",
    "mot_de_passe": "Magasin@123",
    "role": "magasinier"
}
```

---

## Checklist

```txt
[ ] 1.  Login Super Admin
[ ] 2.  Créer entreprise + manager
[ ] 3.  Vérifier entreprise créée
[ ] 4.  Login Manager
[ ] 5.  Vérifier profil /me
[ ] 6.  Créer produit 1
[ ] 7.  Créer produit 2
[ ] 8.  Créer produit 3
[ ] 9.  Vérifier produits
[ ] 10. Créer client 1
[ ] 11. Créer client 2
[ ] 12. Vérifier clients
[ ] 13. Créer devis
[ ] 14. Convertir devis en facture
[ ] 15. Créer vente directe
[ ] 16. Voir toutes les ventes
[ ] 17. Enregistrer paiement espèces
[ ] 18. Enregistrer paiement mobile money
[ ] 19. Rapport caisse
[ ] 20. Dashboard stats
[ ] 21. Rapports
[ ] 22. Créer caissier
[ ] 23. Créer magasinier
```