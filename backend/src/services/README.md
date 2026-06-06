# Dossier services

Ce dossier contient les services reutilisables. Un service n'est pas directement une route: il fournit une fonctionnalite appelee par les controllers ou middlewares.

## Fichiers

1. `auditService.js`: prepare et enregistre les activites utilisateur dans `user_activity_logs`. Il masque les champs sensibles comme les mots de passe et resume l'action effectuee.

2. `mailService.js`: configure `nodemailer` avec Gmail, verifie si l'email est pret, envoie des emails simples et envoie l'email de bienvenue lors de la creation d'un utilisateur.

3. `notificationService.js`: cree des notifications et permet de notifier les managers actifs d'une entreprise.

4. `schemaService.js`: applique au demarrage les ajustements de schema necessaires. Il cree certaines tables si elles manquent, dont `fournisseurs`, et ajoute des colonnes utiles comme `mouvements_stock.fournisseur_id` sans casser la base existante.
