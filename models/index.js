const { Sequelize } = require('sequelize');
const config = require('../config/database-config');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const ProcessData = require('./ProcessData')(sequelize);
const User = require('./User')(sequelize);

const models = {
  ProcessData,
  User,
  sequelize
};

// Модельдерді синхрондау (тек қажет болғанда)
const syncDatabase = async () => {
  // SYNC_DB=true болғанда ғана синхронизациялау
  // Әдетте миграцияларды қолдану керек
  const shouldSync = process.env.SYNC_DB === 'true';
  
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL базасына қосылу сәтті!');
    
    if (shouldSync) {
      console.log('⚠️  ЕСКЕРТУ: SYNC_DB=true - Модельдер синхронизациялануда...');
      console.log('⚠️  Әдетте миграцияларды қолдану керек: npm run db:migrate');
      
      // Модельдерді синхрондау (CodeFirst)
      await sequelize.sync({ alter: true });
      console.log('✅ Модельдер сәтті синхронизацияланды!');
    } else {
      console.log('ℹ️  Синхронизация өшірілген (SYNC_DB=false немесе жоқ)');
      console.log('ℹ️  Миграцияларды қолдану үшін: npm run db:migrate');
    }
  } catch (error) {
    console.error('Базаны синхрондау кезінде қате:', error);
    throw error;
  }
};

module.exports = {
  ...models,
  syncDatabase
};
