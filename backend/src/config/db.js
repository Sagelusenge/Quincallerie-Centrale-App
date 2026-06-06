import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const sslMode = String(process.env.DB_SSL || '').toLowerCase();
const useSsl = ['true', 'required', '1'].includes(sslMode);

// Création du pool de connexions MySQL
const pool = mysql.createPool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user:     process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    ssl:      useSsl ? { rejectUnauthorized: false } : undefined,
    waitForConnections: true,
    connectionLimit: 10,
});

export default pool;
