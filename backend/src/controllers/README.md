# Dossier controllers

Ce dossier contient les controllers. Un controller recoit la requete Express, valide les donnees, execute la logique metier, interroge la base de donnees puis renvoie une reponse JSON.

## Fichiers

1. `authController.js`: gere la connexion, la verification du profil connecte, le changement de mot de passe, la demande de recuperation et la reinitialisation par un manager. Il genere les tokens JWT et compare les mots de passe bcrypt ou anciens hash SHA-256.

2. `categorieController.js`: gere les categories de produits. Il liste, cree, modifie et supprime les categories, avec generation/nettoyage de references.

3. `clientController.js`: gere les clients de l'entreprise. Il liste les clients avec statistiques d'achats, affiche le detail d'un client et son historique, cree, modifie et supprime un client.

4. `dashboardController.js`: fournit les statistiques du tableau de bord. Il appelle la procedure stockee `sp_GetDashboardStats`, retourne les ventes mensuelles, les alertes de stock et les produits les plus vendus.

5. `mailController.js`: gere l'etat de la configuration mail, l'historique des messages, l'envoi d'un email personnalise et l'envoi d'une notification a toute l'equipe.

6. `notificationController.js`: liste les notifications de l'utilisateur connecte et permet de marquer une notification comme lue.

7. `paiementController.js`: enregistre les paiements d'une facture, controle que le paiement ne depasse pas le reste a payer, appelle `sp_EnregistrerPaiement`, puis fournit le rapport de caisse et la repartition des paiements.

8. `panierController.js`: gere le flux panier, base sur les anciennes tables de devis. Il liste, affiche, cree, modifie, convertit en facture, annule et supprime les paniers en attente.

9. `produitController.js`: gere les produits et le stock. Il liste les produits avec statut de stock, affiche les mouvements recents, cree, modifie, supprime et approvisionne les produits.

10. `rapportController.js`: fournit les rapports: factures, creances, inventaire stock, top acheteurs et historique d'achat par client.

11. `setupController.js`: gere la premiere installation. Il indique si le setup est disponible et cree la premiere entreprise avec son premier manager.

12. `utilisateurController.js`: permet au manager de gerer les utilisateurs internes: liste, creation, modification, activation/desactivation, suppression et historique d'activite.

13. `venteController.js`: gere les factures/ventes directes. Il liste, affiche, cree, modifie et supprime les ventes tout en controlant le stock et les paiements existants.

