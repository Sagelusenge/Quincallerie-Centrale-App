# Backup automatique de la base de donnees

Le backend peut generer automatiquement un fichier SQL de backup de la base de donnees. Le backup contient la structure des tables, les vues et les donnees.

## Activation

Ajouter ces variables dans `.env` ou dans les variables d'environnement Render:

```txt
DB_BACKUP_ENABLED=true
DB_BACKUP_INTERVAL_HOURS=12
DB_BACKUP_RETENTION_DAYS=14
DB_BACKUP_DIR=backups
```

Avec cette configuration, le backend cree un backup au demarrage puis relance un backup toutes les 12 heures. Si `DB_BACKUP_ENABLED` n'est pas defini, le backup est active par defaut. Pour le desactiver explicitement:

```txt
DB_BACKUP_ENABLED=false
```

## Emplacement des fichiers

Par defaut, les fichiers sont crees dans:

```txt
backend/backups
```

Le nom du fichier ressemble a:

```txt
defaultdb-backup-2026-06-07T18-59-57-661Z.sql
```

## Retention

`DB_BACKUP_RETENTION_DAYS` indique combien de jours les anciens backups doivent rester dans le dossier. Par defaut, les backups de plus de 14 jours sont supprimes.

## Attention avec Render

Sur un Web Service Render, le disque peut etre ephemere selon la configuration du service. Cela veut dire qu'un fichier cree localement dans `backups` peut disparaitre apres un redeploiement ou un redemarrage si aucun disque persistant n'est attache.

Pour une sauvegarde vraiment durable en production, utiliser au moins une de ces options:

- activer/verifier les backups automatiques Aiven;
- attacher un disque persistant Render;
- envoyer les fichiers de backup vers un stockage externe comme S3, Google Drive ou autre.

Le service ajoute ici donne deja la generation automatique du fichier SQL toutes les 12 heures.

## Restauration

Pour restaurer un fichier SQL:

```txt
mysql -h HOST -P PORT -u USER -p DATABASE_NAME < backup.sql
```

Avant une restauration en production, tester le fichier sur une base de test.
