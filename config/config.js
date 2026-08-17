require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const shared = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  database: process.env.DB_NAME || 'zigna_vigil',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  dialect: 'mysql',
  logging: false,
};

module.exports = {
  development: { ...shared },
  test: { ...shared, database: process.env.DB_NAME_TEST || 'zigna_vigil_test' },
  production: { ...shared },
};
