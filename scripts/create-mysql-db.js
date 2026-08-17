/**
 * Create the zigna_vigil MySQL database if it does not exist.
 * Usage: node scripts/create-mysql-db.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

async function main() {
  const host = process.env.DB_HOST || '127.0.0.1';
  const port = parseInt(process.env.DB_PORT, 10) || 3306;
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || process.env.DB_PASS || '';
  const database = process.env.DB_NAME || 'zigna_vigil';

  const conn = await mysql.createConnection({ host, port, user, password });
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  console.log(`MySQL database ready: ${database} @ ${host}:${port}`);
  await conn.end();
}

main().catch((err) => {
  console.error('Failed to create database:', err.message);
  process.exit(1);
});
