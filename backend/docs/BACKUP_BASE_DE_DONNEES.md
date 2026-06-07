# Backup automatique de la base de donnees

Le backend peut generer automatiquement un fichier SQL de backup de la base de donnees. Le backup contient la structure des tables, les vues et les donnees.

## Activation

Ajouter ces variables dans `.env` ou dans les variables d'environnement Render:

```txt
DB_BACKUP_ENABLED=true
DB_BACKUP_INTERVAL_HOURS=12
DB_BACKUP_RETENTION_DAYS=0
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

## Conservation

`DB_BACKUP_RETENTION_DAYS=0` signifie que le backend ne supprime pas automatiquement les anciens backups. C'est le comportement recommande si l'objectif est de pouvoir recuperer les donnees apres une suppression accidentelle, une erreur humaine ou un piratage.

Si un jour il faut limiter l'espace disque, il est possible de mettre une valeur positive:

```txt
DB_BACKUP_RETENTION_DAYS=90
```

Dans ce cas seulement, les fichiers plus anciens que 90 jours seront supprimes.

## Attention avec Render

Sur un Web Service Render, le disque peut etre ephemere selon la configuration du service. Cela veut dire qu'un fichier cree localement dans `backups` peut disparaitre apres un redeploiement ou un redemarrage si aucun disque persistant n'est attache.

Concretement, avec la configuration actuelle, les fichiers sont stockes dans le dossier local du backend:

```txt
backend/backups
```

Sur Render, cela correspond au filesystem du service Render. Ce n'est pas encore une protection suffisante contre un incident grave, parce que le fichier reste proche de l'application.

Pour une sauvegarde vraiment durable en production, utiliser au moins une de ces options:

- activer/verifier les backups automatiques Aiven;
- attacher un disque persistant Render;
- envoyer les fichiers de backup vers un stockage externe comme S3, Google Drive ou autre.

Le service ajoute ici donne deja la generation automatique du fichier SQL toutes les 12 heures. Pour une vraie strategie anti-piratage, le backup doit ensuite etre stocke hors du serveur applicatif.

## Restauration

Pour restaurer un fichier SQL:

```txt
mysql -h HOST -P PORT -u USER -p DATABASE_NAME < backup.sql
```

Avant une restauration en production, tester le fichier sur une base de test.
