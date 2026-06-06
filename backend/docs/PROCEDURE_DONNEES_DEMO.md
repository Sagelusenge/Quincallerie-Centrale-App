# Procedure des donnees de demonstration

Ce fichier explique le chemin logique utilise pour creer une petite base de demonstration dans `defaultdb` sur Aiven. L'objectif est d'avoir une entreprise unique avec un exemple dans presque chaque table.

## 1. Creation de l'entreprise

Au depart, la base doit contenir une seule entreprise:

```txt
Entreprise: Quincallerie Centrale
Email: quincallerie@gmail.com
Num ID: 93dnjf83
```

Cette entreprise represente l'installation active du systeme. Le projet fonctionne avec la logique suivante:

```txt
1 base de donnees = 1 entreprise
```

## 2. Creation du manager

Apres l'entreprise, on cree le premier utilisateur manager:

```txt
Nom: kitsa
Email: sagelusenge@gmail.com
Mot de passe: Bonsoirs
Role: manager
```

Ce manager permet de se connecter et d'administrer le reste de l'application.

## 3. Connexion

Le manager se connecte avec:

```txt
POST /api/auth/login
```

Body:

```json
{
  "email": "sagelusenge@gmail.com",
  "password": "Bonsoirs"
}
```

Le backend retourne un token JWT. Ce token doit ensuite etre envoye sur les routes protegees:

```txt
Authorization: Bearer TOKEN
```

## 4. Creation d'un client

Une fois connecte, le manager peut creer un client:

```txt
POST /api/clients
```

Exemple cree dans la demo:

```txt
Client: Client Test Quincaillerie
Telephone: +243810000002
ID genere: CLI-00001
```

Le client sert ensuite pour les paniers, les ventes/factures et l'historique d'achat.

## 5. Creation d'une categorie

On cree une categorie pour classer les produits:

```txt
Categorie: Outillage
Reference: OUTILLAGE
ID: CAT-OUTILLAGE-001
```

Elle permet de regrouper les articles comme marteaux, pinces, tournevis, etc.

## 6. Creation d'un fournisseur

Avant un approvisionnement, on cree un fournisseur:

```txt
Fournisseur: Depot General Quincaillerie
ID: FOU-DEPOT-001
```

Le fournisseur sert a tracer d'ou vient le stock ajoute.

## 7. Creation d'un produit

On cree ensuite un produit lie a l'entreprise et a la categorie:

```txt
Produit: Marteau 500g
Reference: MARTEAU500
ID genere: PRD-MARTEAU500-ENT-QUI-
Prix HT: 10.00
TVA: 16%
Stock initial: 20
```

Le produit est l'article qui sera vendu ou approvisionne.

## 8. Approvisionnement via fournisseur

On ajoute du stock au produit en indiquant le fournisseur:

```txt
Produit: Marteau 500g
Fournisseur: Depot General Quincaillerie
Quantite ajoutee: 10
Mouvement stock: entree
```

Cela cree une ligne dans `mouvements_stock` avec:

```txt
type_mouvement = entree
fournisseur_id = FOU-DEPOT-001
```

## 9. Creation d'un panier/devis

On cree un panier pour le client avec le produit:

```txt
Panier/Devis: DEV-00001
Client: CLI-00001
Produit: Marteau 500g
Quantite: 2
Prix unitaire HT: 10.00
```

Dans la base, le panier utilise les tables `devis` et `lignes_devis`.

## 10. Creation d'une vente/facture

On cree ensuite une facture:

```txt
Facture/Vente: FAC-2026-00001
Client: CLI-00001
Produit: Marteau 500g
Quantite vendue: 1
Prix unitaire HT: 10.00
```

Quand une ligne de vente est inseree, le trigger de stock diminue automatiquement la quantite du produit et cree un mouvement:

```txt
type_mouvement = sortie
```

C'est pour cela que la table `mouvements_stock` contient deux lignes dans la demo:

```txt
1 entree: approvisionnement via fournisseur
1 sortie: vente du produit
```

## 11. Enregistrement d'un paiement

Enfin, on enregistre un paiement partiel sur la facture:

```txt
Paiement: PAY-2606-00001
Facture: FAC-2026-00001
Montant: 5.00
Mode: especes
```

Le paiement est rattache a la facture. Le backend verifie normalement qu'un paiement ne depasse pas le reste a payer.

## 12. Autres donnees ajoutees

Pour avoir une ligne dans les tables de suivi, la demo ajoute aussi:

```txt
1 notification
1 message email
1 log d'activite utilisateur
```

Ces donnees servent a tester les modules notifications, mails et historique d'activite.

## Resume du parcours

```txt
Creer entreprise
Creer manager
Se connecter
Creer client
Creer categorie
Creer fournisseur
Creer produit
Approvisionner le produit via fournisseur
Creer panier/devis
Creer vente/facture
Enregistrer paiement
Consulter notifications, mails, rapports et historique
```

