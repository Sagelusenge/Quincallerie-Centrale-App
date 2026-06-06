# Dossier routes

Ce dossier contient les fichiers de routes Express. Une route definit l'URL, la methode HTTP, les middlewares de securite et le controller a appeler.

## Fichiers

1. `authRoutes.js`: routes d'authentification: login, profil connecte, mot de passe oublie, changement et reinitialisation de mot de passe.

2. `categorieRoutes.js`: routes des categories. Les managers et magasiniers peuvent creer/modifier; seul le manager peut supprimer.

3. `clientRoutes.js`: routes des clients. Manager et caissier peuvent consulter/creer; seul le manager peut modifier/supprimer.

4. `dashboardRoutes.js`: routes des statistiques du tableau de bord, ventes mensuelles, alertes stock et produits les plus vendus.

5. `fournisseurRoutes.js`: routes des fournisseurs. Manager et magasinier peuvent consulter/creer/modifier; seul le manager peut supprimer ou desactiver.

6. `mailRoutes.js`: routes de messagerie. Elles verifient que l'utilisateur est connecte et limitent l'envoi aux managers.

7. `notificationRoutes.js`: routes pour lister les notifications et les marquer comme lues.

8. `paiementRoutes.js`: routes pour enregistrer les paiements, consulter le rapport de caisse et la repartition des modes de paiement.

9. `panierRoutes.js`: routes du panier: liste, detail, creation, modification, conversion en facture, annulation et suppression.

10. `produitRoutes.js`: routes des produits, mouvements de stock et approvisionnement. L'approvisionnement recoit aussi le fournisseur.

11. `rapportRoutes.js`: routes des rapports: factures, creances, stock, top acheteurs et historique client.

12. `setupRoutes.js`: routes publiques de premiere installation: statut du setup et creation initiale de l'entreprise.

13. `utilisateurRoutes.js`: routes de gestion des utilisateurs, accessibles au manager.

14. `venteRoutes.js`: routes des ventes/factures directes: liste, detail, creation, modification et suppression.

## Prefixes dans app.js

Chaque fichier est monte dans `app.js` avec un prefixe comme `/api/auth`, `/api/clients`, `/api/produits`, etc.
