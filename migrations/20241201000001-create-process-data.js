'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Таблица бар ма тексеру
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'process_data'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists[0].exists) {
      console.log('⚠️  Таблица "process_data" қазірдің өзінде бар. Migration өткізілмейді.');
      return;
    }

    await queryInterface.createTable('process_data', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      x1: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        comment: 'Шикізат шығыны (т/тәулік)'
      },
      x2: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        comment: 'Шикізат тығыздығы (т/м³)'
      },
      x3: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Шикізат температурасы (°C)'
      },
      x4: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Реактор температурасы (°C)'
      },
      x5: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        comment: 'Реактор қысымы (кгс/см²)'
      },
      x6: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        comment: 'Катализатор шығыны (т/тәулік)'
      },
      y1: {
        type: Sequelize.DECIMAL(10, 3),
        allowNull: false,
        comment: 'Бензин көлемі (%)'
      },
      y2: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: false,
        comment: 'Бензин тығыздығы'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        comment: 'Жасалу уақыты'
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
        comment: 'Жаңарту уақыты'
      }
    });

    // Индекс бар ма тексеру
    const indexExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'process_data' 
        AND indexname = 'process_data_created_at'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!indexExists[0].exists) {
      await queryInterface.addIndex('process_data', ['createdAt'], {
        name: 'process_data_created_at'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Таблица бар ма тексеру
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'process_data'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists[0].exists) {
      await queryInterface.dropTable('process_data');
    }
  }
};
