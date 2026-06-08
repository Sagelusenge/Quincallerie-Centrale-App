export const ensureRuntimeSchema = async (pool) => {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS categorie_produit (
            id_categorie VARCHAR(50) PRIMARY KEY,
            entreprise_id VARCHAR(50) NOT NULL,
            reference_categorie VARCHAR(50),
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
            recipient_type ENUM('user','manager') NOT NULL DEFAULT 'user',
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

    await pool.query(`
        CREATE TABLE IF NOT EXISTS mail_messages (
            id_mail INT AUTO_INCREMENT PRIMARY KEY,
            entreprise_id VARCHAR(50),
            user_id VARCHAR(50),
            sender_email VARCHAR(160),
            to_email VARCHAR(160) NOT NULL,
            subject VARCHAR(255) NOT NULL,
            message TEXT,
            status VARCHAR(40) NOT NULL DEFAULT 'envoye',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_mail_entreprise (entreprise_id, created_at),
            INDEX idx_mail_user (user_id, created_at)
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS mail_settings (
            id_setting INT PRIMARY KEY DEFAULT 1,
            service VARCHAR(80) NOT NULL DEFAULT 'gmail',
            email_user VARCHAR(160) NOT NULL,
            email_pass VARCHAR(255) NOT NULL,
            from_name VARCHAR(120) NOT NULL DEFAULT 'CRM PME',
            actif BOOLEAN DEFAULT TRUE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS user_activity_logs (
            id_log INT AUTO_INCREMENT PRIMARY KEY,
            entreprise_id VARCHAR(50) NOT NULL,
            user_id VARCHAR(50) NOT NULL,
            user_name VARCHAR(160),
            user_role VARCHAR(50),
            action_type VARCHAR(30) NOT NULL,
            module VARCHAR(80),
            entity_id VARCHAR(80),
            description VARCHAR(255) NOT NULL,
            metadata JSON NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_activity_entreprise_date (entreprise_id, created_at),
            INDEX idx_activity_user_date (user_id, created_at)
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

    await addColumnIfMissing('notifications', 'recipient_type', "ENUM('user','manager') NOT NULL DEFAULT 'user'");
    await addColumnIfMissing('notifications', 'recipient_user_id', 'VARCHAR(50) NULL');
    await addColumnIfMissing('notifications', 'entreprise_id', 'VARCHAR(50) NULL');
    await addColumnIfMissing('notifications', 'titre', "VARCHAR(160) NOT NULL DEFAULT 'Notification'");
    await addColumnIfMissing('notifications', 'message', 'TEXT NULL');
    await addColumnIfMissing('notifications', 'lu', 'BOOLEAN DEFAULT FALSE');
    await addColumnIfMissing('notifications', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    await addColumnIfMissing('mail_messages', 'entreprise_id', 'VARCHAR(50) NULL');
    await addColumnIfMissing('mail_messages', 'user_id', 'VARCHAR(50) NULL');
    await addColumnIfMissing('mail_messages', 'sender_email', 'VARCHAR(160) NULL');
    await addColumnIfMissing('mail_messages', 'to_email', "VARCHAR(160) NOT NULL DEFAULT ''");
    await addColumnIfMissing('mail_messages', 'subject', "VARCHAR(255) NOT NULL DEFAULT ''");
    await addColumnIfMissing('mail_messages', 'message', 'TEXT NULL');
    await addColumnIfMissing('mail_messages', 'status', 'VARCHAR(40) NOT NULL DEFAULT "envoye"');
    await addColumnIfMissing('mail_messages', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

    await addColumnIfMissing('mail_settings', 'service', 'VARCHAR(80) NOT NULL DEFAULT "gmail"');
    await addColumnIfMissing('mail_settings', 'email_user', 'VARCHAR(160) NOT NULL');
    await addColumnIfMissing('mail_settings', 'email_pass', 'VARCHAR(255) NOT NULL');
    await addColumnIfMissing('mail_settings', 'from_name', 'VARCHAR(120) NOT NULL DEFAULT "CRM PME"');
    await addColumnIfMissing('mail_settings', 'actif', 'BOOLEAN DEFAULT TRUE');
    await addColumnIfMissing('mail_settings', 'updated_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');

    const [mailSettings] = await pool.query(`
        SELECT id_setting
        FROM mail_settings
        WHERE id_setting = 1
        LIMIT 1
    `);

    if (mailSettings.length === 0 && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        await pool.query(
            `INSERT INTO mail_settings
                (id_setting, service, email_user, email_pass, from_name, actif)
             VALUES (1, 'gmail', ?, ?, 'CRM PME', TRUE)`,
            [process.env.EMAIL_USER, process.env.EMAIL_PASS]
        );
    }

    await addColumnIfMissing('user_activity_logs', 'entreprise_id', 'VARCHAR(50) NOT NULL');
    await addColumnIfMissing('user_activity_logs', 'user_id', 'VARCHAR(50) NOT NULL');
    await addColumnIfMissing('user_activity_logs', 'user_name', 'VARCHAR(160) NULL');
    await addColumnIfMissing('user_activity_logs', 'user_role', 'VARCHAR(50) NULL');
    await addColumnIfMissing('user_activity_logs', 'action_type', 'VARCHAR(30) NOT NULL DEFAULT "ACTION"');
    await addColumnIfMissing('user_activity_logs', 'module', 'VARCHAR(80) NULL');
    await addColumnIfMissing('user_activity_logs', 'entity_id', 'VARCHAR(80) NULL');
    await addColumnIfMissing('user_activity_logs', 'description', 'VARCHAR(255) NOT NULL DEFAULT "Action utilisateur"');
    await addColumnIfMissing('user_activity_logs', 'metadata', 'JSON NULL');
    await addColumnIfMissing('user_activity_logs', 'created_at', 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP');

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

    await addColumnIfMissing('produits', 'photo_url', 'TEXT NULL');
    await addColumnIfMissing('categorie_produit', 'reference_categorie', 'VARCHAR(50) NULL');
    await addColumnIfMissing('categorie_produit', 'photo_url', 'TEXT NULL');

    await pool.query(`
        UPDATE categorie_produit
        SET reference_categorie = LEFT(id_categorie, 50)
        WHERE reference_categorie IS NULL OR reference_categorie = ''
    `);

    await pool.query(`
        UPDATE notifications
        SET recipient_type = 'manager'
        WHERE recipient_type <> 'user'
    `).catch(() => null);

    await pool.query(`
        ALTER TABLE notifications
        MODIFY recipient_type ENUM('user','manager') NOT NULL DEFAULT 'user'
    `).catch(() => null);
};
