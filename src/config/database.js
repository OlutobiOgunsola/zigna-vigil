const { Sequelize } = require('sequelize');
const config = require('./environment');
const { getLogger } = require('../utils/logging');
const path = require('path');

const log = getLogger();

// Use SQLite for local development, MySQL in production
const isSQLite = config.nodeEnv === 'development' && !process.env.DB_HOST;

const sequelize = isSQLite
  ? new Sequelize({
      dialect: 'sqlite',
      storage: path.join(__dirname, '../../vigil.db'),
      logging: false,
    })
  : new Sequelize(
      process.env.DB_NAME || 'zigna_vigil',
      process.env.DB_USER || 'root',
      process.env.DB_PASS || '',
      {
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        dialect: 'mysql',
        logging: config.nodeEnv === 'development' ? (msg) => log.debug(msg) : false,
        pool: { max: 10, min: 2, acquire: 30000, idle: 10000 },
        define: { timestamps: true, underscored: true },
      }
    );

module.exports = sequelize;
