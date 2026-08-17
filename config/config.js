require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

module.exports = {
  development: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    database: process.env.DB_NAME || 'zigna_vigil',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    dialect: 'mysql',
    logging: false,
  },
};
