# Dossier config

Ce dossier regroupe la configuration technique partagee par le backend.

## Fichiers

- `db.js`: cree le pool de connexions MySQL avec `mysql2/promise`. Il lit `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASS`, `DB_NAME` et `DB_SSL` depuis les variables d'environnement. Le pool est exporte pour etre utilise par les controllers et services.

## Remarque de deploiement

Pour Aiven ou une base distante avec SSL obligatoire, utiliser par exemple:

```txt
DB_PORT=14880
DB_SSL=REQUIRED
```

