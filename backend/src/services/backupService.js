import fs from 'fs/promises';
import path from 'path';

const DEFAULT_INTERVAL_HOURS = 12;
const DEFAULT_RETENTION_DAYS = 0;

const quoteIdentifier = (value) => `\`${String(value).replace(/`/g, '``')}\``;

const escapeSqlValue = (value) => {
    if (value === null || value === undefined) return 'NULL';
    if (value instanceof Date) {
        return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
    }
    if (Buffer.isBuffer(value)) {
        return `X'${value.toString('hex')}'`;
    }
    if (typeof value === 'number') {
        return Number.isFinite(value) ? String(value) : 'NULL';
    }
    if (typeof value === 'boolean') {
        return value ? '1' : '0';
    }

    return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
};

const getBackupDir = () => path.resolve(process.cwd(), process.env.DB_BACKUP_DIR || 'backups');

const getTimestamp = () => new Date()
    .toISOString()
    .replace(/[:.]/g, '-');

const isBackupEnabled = () => String(process.env.DB_BACKUP_ENABLED || 'true').toLowerCase() !== 'false';

const getIntervalMs = () => {
    const hours = Number(process.env.DB_BACKUP_INTERVAL_HOURS || DEFAULT_INTERVAL_HOURS);
    return Math.max(hours || DEFAULT_INTERVAL_HOURS, 1) * 60 * 60 * 1000;
};

const getRetentionMs = () => {
    const days = Number(process.env.DB_BACKUP_RETENTION_DAYS || DEFAULT_RETENTION_DAYS);
    if (!Number.isFinite(days) || days <= 0) return null;
    return days * 24 * 60 * 60 * 1000;
};

const getTables = async (pool) => {
    const [rows] = await pool.query(`
        SELECT TABLE_NAME, TABLE_TYPE
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
    `);

    const priority = [
        'entreprise',
        'sequences',
        'utilisateur',
        'categorie_produit',
        'fournisseurs',
        'client',
        'produits',
        'mouvements_stock',
        'devis',
        'lignes_devis',
        'ventes',
        'lignes_ventes',
        'paiement',
        'notifications',
        'mail_messages',
        'user_activity_logs'
    ];

    return rows.sort((a, b) => {
        if (a.TABLE_TYPE !== b.TABLE_TYPE) return a.TABLE_TYPE === 'BASE TABLE' ? -1 : 1;
        const aIndex = priority.indexOf(a.TABLE_NAME);
        const bIndex = priority.indexOf(b.TABLE_NAME);
        if (aIndex !== -1 || bIndex !== -1) {
            return (aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex)
                - (bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex);
        }
        return a.TABLE_NAME.localeCompare(b.TABLE_NAME);
    });
};

const writeTableData = async (pool, tableName) => {
    const [rows] = await pool.query(`SELECT * FROM ${quoteIdentifier(tableName)}`);
    if (rows.length === 0) return '';

    const columns = Object.keys(rows[0]);
    const columnSql = columns.map(quoteIdentifier).join(', ');
    const valuesSql = rows
        .map((row) => `(${columns.map((column) => escapeSqlValue(row[column])).join(', ')})`)
        .join(',\n');

    return `INSERT INTO ${quoteIdentifier(tableName)} (${columnSql}) VALUES\n${valuesSql};\n\n`;
};

export const createDatabaseBackup = async (pool) => {
    const backupDir = getBackupDir();
    await fs.mkdir(backupDir, { recursive: true });

    const dbName = process.env.DB_NAME || 'database';
    const fileName = `${dbName}-backup-${getTimestamp()}.sql`;
    const filePath = path.join(backupDir, fileName);
    const tables = await getTables(pool);

    const chunks = [
        `-- Backup CRM PME\n`,
        `-- Database: ${dbName}\n`,
        `-- Created at: ${new Date().toISOString()}\n\n`,
        `SET FOREIGN_KEY_CHECKS = 0;\n\n`
    ];

    const baseTables = tables.filter((table) => table.TABLE_TYPE === 'BASE TABLE');
    const views = tables.filter((table) => table.TABLE_TYPE === 'VIEW');

    for (const table of baseTables) {
        const tableName = table.TABLE_NAME;
        const [[createRow]] = await pool.query(`SHOW CREATE TABLE ${quoteIdentifier(tableName)}`);
        chunks.push(`DROP TABLE IF EXISTS ${quoteIdentifier(tableName)};\n`);
        chunks.push(`${createRow['Create Table']};\n\n`);
        chunks.push(await writeTableData(pool, tableName));
    }

    for (const view of views) {
        const viewName = view.TABLE_NAME;
        const [[createRow]] = await pool.query(`SHOW CREATE VIEW ${quoteIdentifier(viewName)}`);
        chunks.push(`DROP VIEW IF EXISTS ${quoteIdentifier(viewName)};\n`);
        chunks.push(`${createRow['Create View']};\n\n`);
    }

    chunks.push(`SET FOREIGN_KEY_CHECKS = 1;\n`);
    await fs.writeFile(filePath, chunks.join(''), 'utf8');

    return filePath;
};

export const cleanupOldBackups = async () => {
    const backupDir = getBackupDir();
    const retentionMs = getRetentionMs();
    if (!retentionMs) return;

    const now = Date.now();

    await fs.mkdir(backupDir, { recursive: true });
    const files = await fs.readdir(backupDir, { withFileTypes: true });

    await Promise.all(files
        .filter((file) => file.isFile() && file.name.endsWith('.sql'))
        .map(async (file) => {
            const filePath = path.join(backupDir, file.name);
            const stat = await fs.stat(filePath);
            if (now - stat.mtimeMs > retentionMs) {
                await fs.unlink(filePath);
            }
        }));
};

export const startAutomaticBackups = (pool) => {
    if (!isBackupEnabled()) {
        console.log('Backup automatique desactive');
        return null;
    }

    const runBackup = async () => {
        try {
            const filePath = await createDatabaseBackup(pool);
            await cleanupOldBackups();
            console.log(`Backup base de donnees cree: ${filePath}`);
        } catch (error) {
            console.error('Erreur backup base de donnees:', error.message);
        }
    };

    runBackup();
    const timer = setInterval(runBackup, getIntervalMs());
    return timer;
};
