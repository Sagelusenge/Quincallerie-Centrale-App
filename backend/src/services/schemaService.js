export const ensureRuntimeSchema = async (pool) => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS categorie_produit (
            id_categorie VARCHAR(50) PRIMARY KEY,
            entreprise_id VARCHAR(50) NOT NULL,
            nom VARCHAR(120) NOT NULL,
            description VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uniq_categorie_entreprise_nom (entreprise_id, nom),
            FOREIGN KEY (entreprise_id) REFERENCES entreprise(id_entreprise) ON DELETE CASCADE
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS notifications (
            id_notification INT AUTO_INCREMENT PRIMARY KEY,
            recipient_type ENUM('user','super_admin','enterprise_admin') NOT NULL DEFAULT 'user',
            recipient_user_id VARCHAR(50),
            entreprise_id VARCHAR(50),
            titre VARCHAR(160) NOT NULL,
            message TEXT NOT NULL,
            lu BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_notifications_user (recipient_user_id, lu),
            INDEX idx_notifications_entreprise (entreprise_id, recipient_type, lu)
        )
    `);

    const addColumnIfMissing = async (table, column, definition) => {
        const [rows] = await pool.query(
            `SELECT COLUMN_NAME
             FROM INFORMATION_SCHEMA.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND COLUMN_NAME = ?`,
            [table, column]
        );

        if (rows.length === 0) {
            await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        }
    };

    await addColumnIfMissing('notifications', 'recipient_type', "ENUM('user','super_admin','enterprise_admin') NOT NULL DEFAULT 'user'");
    await addColumnIfMissing('notifications', 'recipient_user_id', 'VARCHAR(50) NULL');
    await addColumnIfMissing('notifications', 'entreprise_id', 'VARCHAR(50) NULL');
    await addColumnIfMissing('notifications', 'titre', "VARCHAR(160) NOT NULL DEFAULT 'Notification'");
    await addColumnIfMissing('notifications', 'message', 'TEXT NULL');
    await addColumnIfMissing('notifications', 'lu', 'BOOLEAN DEFAULT FALSE');
    await addColumnIfMissing('notifications', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    const [productColumns] = await pool.query(`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'produits'
          AND COLUMN_NAME = 'categorie_id'
    `);

    if (productColumns.length === 0) {
        await pool.query(`ALTER TABLE produits ADD COLUMN categorie_id VARCHAR(50) NULL AFTER nom`);
    }
};
