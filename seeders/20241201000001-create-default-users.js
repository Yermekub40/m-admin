'use strict';
const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Таблица бар ма тексеру
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      console.log('⚠️  Таблица "users" жоқ. Seed өткізілмейді. Алдымен migration-ды орындаңыз.');
      return;
    }

    // Барлық пайдаланушыларды тексеру
    const existingUsers = await queryInterface.sequelize.query(
      `SELECT username FROM users WHERE username IN ('admin', 'engineer', 'operator');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const existingUsernames = existingUsers.map(user => user.username);
    const usersToInsert = [];

    const salt = await bcrypt.genSalt(10);
    
    // Админ пайдаланушы
    if (!existingUsernames.includes('admin')) {
      const adminPassword = await bcrypt.hash('admin123', salt);
      usersToInsert.push({
        username: 'admin',
        password: adminPassword,
        role: 'admin',
        fullName: 'Жүйе әкімшісі',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      console.log('ℹ️  Пайдаланушы "admin" қазірдің өзінде бар. Өткізілмейді.');
    }
    
    // Инженер-технолог пайдаланушы
    if (!existingUsernames.includes('engineer')) {
      const engineerPassword = await bcrypt.hash('engineer123', salt);
      usersToInsert.push({
        username: 'engineer',
        password: engineerPassword,
        role: 'engineer-technologist',
        fullName: 'Инженер-технолог',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      console.log('ℹ️  Пайдаланушы "engineer" қазірдің өзінде бар. Өткізілмейді.');
    }
    
    // Оператор пайдаланушы
    if (!existingUsernames.includes('operator')) {
      const operatorPassword = await bcrypt.hash('operator123', salt);
      usersToInsert.push({
        username: 'operator',
        password: operatorPassword,
        role: 'operator',
        fullName: 'Оператор',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } else {
      console.log('ℹ️  Пайдаланушы "operator" қазірдің өзінде бар. Өткізілмейді.');
    }

    // Тек жоқ пайдаланушыларды қосу
    if (usersToInsert.length > 0) {
      await queryInterface.bulkInsert('users', usersToInsert);
      console.log(`✅ ${usersToInsert.length} пайдаланушы сәтті қосылды.`);
    } else {
      console.log('ℹ️  Барлық пайдаланушылар қазірдің өзінде бар. Seed өткізілмейді.');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Таблица бар ма тексеру
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!tableExists[0].exists) {
      console.log('⚠️  Таблица "users" жоқ. Seed down өткізілмейді.');
      return;
    }

    // Пайдаланушылар бар ма тексеру
    const existingUsers = await queryInterface.sequelize.query(
      `SELECT username FROM users WHERE username IN ('admin', 'engineer', 'operator');`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingUsers.length === 0) {
      console.log('ℹ️  Пайдаланушылар жоқ. Seed down өткізілмейді.');
      return;
    }

    await queryInterface.bulkDelete('users', {
      username: {
        [Sequelize.Op.in]: ['admin', 'engineer', 'operator']
      }
    }, {});
    
    console.log(`✅ ${existingUsers.length} пайдаланушы сәтті жойылды.`);
  }
};

