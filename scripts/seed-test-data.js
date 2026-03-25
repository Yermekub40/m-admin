/**
 * Тест деректерімен базаны толтыру скрипті
 * Графиктерді тестеу үшін деректер генерирует
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', 'config.env') });

const { ProcessData, sequelize } = require('../models');

async function seedTestData() {
  try {
    // Базаға қосылуды тексеру
    await sequelize.authenticate();
    console.log('✅ База сәтті қосылды\n');

    console.log('Деректерді енгізуге бастау...');

    // Деректерді генерирует (24 сағат аралығына)
    const now = new Date();
    const testRecords = [];

    function randomBetween(min, max) {
      return Math.random() * (max - min) + min;
    }

    // 24 сағат, 2-сағат интервалмен
    for (let i = 0; i < 12; i++) {
      const timestamp = new Date(now.getTime() - i * 2 * 60 * 60 * 1000);

      testRecords.push({
        x1: randomBetween(200, 280),  // Шикізат шығыны
        x2: randomBetween(0.8, 1.0),   // Тығыздық
        x3: randomBetween(200, 220),   // Шикізат температурасы
        x4: randomBetween(500, 530),   // Реактор températ уресы
        x5: randomBetween(2.0, 2.4),   // Реактор қысымы
        x6: randomBetween(1700, 1800), // Катализатор шығыны
        y1: randomBetween(45, 55),     // Бензин көлемі
        y2: randomBetween(0.68, 0.75), // Бензин тығыздығы
        mode: 'manual',
        createdAt: timestamp,
        updatedAt: timestamp
      });
    }

    console.log(`\n📊 ${testRecords.length} жазба құрылуда...\n`);

    // Жаңа деректерді енгізу
    for (const record of testRecords) {
      await ProcessData.create(record);
    }
    console.log(`✅ ${testRecords.length} жазба сәтті берілді\n`);

    // Деректерді көрсету
    const allData = await ProcessData.findAll({
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    console.log('📝 Енгізілген деректер (ең соңғы 5):');
    allData.forEach((record, idx) => {
      console.log(`  ${idx + 1}. x3=${record.x3}°C x4=${record.x4}°C y1=${record.y1}% y2=${record.y2} (${record.createdAt.toLocaleString()})`);
    });

    console.log('\n✨ Тестілеу деректері сәтті қосылды! Графиктер енді деректерді көрсету керек.');
    
    await sequelize.close();
  } catch (error) {
    console.error('❌ Қате:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedTestData();
