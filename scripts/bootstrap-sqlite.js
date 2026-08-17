/**
 * Bootstrap SQLite schema for local development.
 * Run: node scripts/bootstrap-sqlite.js
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');

const dbPath = path.join(__dirname, '..', 'vigil.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Removed existing vigil.db');
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false,
});

async function run() {
  await sequelize.query(`
    CREATE TABLE vigil_products (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sequelize.query(`
    INSERT INTO vigil_products (id, slug, display_name, is_active) VALUES
      (1, 'zignalyft', 'ZignaLyft', 1),
      (2, 'zignastay', 'ZignaStay', 1);
  `);

  await sequelize.query(`
    CREATE TABLE vigil_sessions (
      id TEXT PRIMARY KEY,
      product_id INTEGER NOT NULL,
      product_slug TEXT NOT NULL,
      business_id INTEGER NOT NULL,
      business_name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      user_fullname TEXT NOT NULL,
      user_email TEXT,
      role TEXT NOT NULL,
      started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_active_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      message_count INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sequelize.query(`
    CREATE TABLE vigil_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      product_slug TEXT NOT NULL,
      business_id INTEGER NOT NULL,
      business_name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      user_fullname TEXT NOT NULL,
      user_email TEXT,
      role TEXT NOT NULL,
      request_id TEXT NOT NULL,
      direction TEXT NOT NULL,
      content TEXT NOT NULL,
      ai_provider TEXT,
      ai_model TEXT,
      input_tokens INTEGER,
      output_tokens INTEGER,
      duration_ms INTEGER,
      status TEXT NOT NULL DEFAULT 'success',
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sequelize.query(`
    CREATE TABLE vigil_tool_executions (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      product_slug TEXT NOT NULL,
      business_id INTEGER NOT NULL,
      business_name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      user_fullname TEXT NOT NULL,
      tool_name TEXT NOT NULL,
      tool_args TEXT,
      tool_result_summary TEXT,
      tool_status TEXT NOT NULL,
      tool_error TEXT,
      permission_used TEXT,
      duration_ms INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sequelize.query(`
    CREATE TABLE vigil_ai_interactions (
      id TEXT PRIMARY KEY,
      message_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      product_id INTEGER NOT NULL,
      product_slug TEXT NOT NULL,
      business_id INTEGER NOT NULL,
      business_name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      user_fullname TEXT NOT NULL,
      provider TEXT NOT NULL,
      model TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      finish_reason TEXT,
      tools_offered TEXT,
      tool_selected TEXT,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'success',
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sequelize.query(`
    CREATE TABLE vigil_daily_metrics (
      id TEXT PRIMARY KEY,
      product_id INTEGER,
      product_slug TEXT,
      business_id INTEGER,
      metric_date TEXT NOT NULL,
      total_messages INTEGER DEFAULT 0,
      total_sessions INTEGER DEFAULT 0,
      total_tool_calls INTEGER DEFAULT 0,
      total_errors INTEGER DEFAULT 0,
      total_input_tokens INTEGER DEFAULT 0,
      total_output_tokens INTEGER DEFAULT 0,
      avg_latency_ms REAL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await sequelize.query(`
    CREATE TABLE vigil_error_logs (
      id TEXT PRIMARY KEY,
      request_id TEXT,
      session_id TEXT,
      product_id INTEGER,
      product_slug TEXT,
      business_id INTEGER,
      business_name TEXT,
      user_id INTEGER,
      user_fullname TEXT,
      role TEXT,
      error_code INTEGER,
      error_name TEXT,
      error_message TEXT,
      error_stack TEXT,
      source TEXT,
      tool_name TEXT,
      ai_provider TEXT,
      endpoint TEXT,
      method TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // SQLite-friendly NOW() substitute via query rewrite is not available;
  // conversation.service uses NOW() — patch via simple views not possible.
  // Instead we rely on Sequelize replacements; bootstrap is enough for tables.

  console.log('SQLite schema created at', dbPath);
  await sequelize.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
