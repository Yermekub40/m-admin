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

    if (!tableExists[0].exists) {
      console.log('⚠️  Таблица "process_data" жоқ. Migration өткізілмейді.');
      return;
    }

    // mode бағаны бар ма тексеру
    const columnExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'process_data' 
        AND column_name = 'mode'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!columnExists[0].exists) {
      console.log('⚠️  Баған "mode" қазірдің өзінде жоқ. Migration өткізілмейді.');
      return;
    }

    // mode бағанын жою
    await queryInterface.removeColumn('process_data', 'mode');
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

    if (!tableExists[0].exists) {
      console.log('⚠️  Таблица "process_data" жоқ. Migration өткізілмейді.');
      return;
    }

    // mode бағаны бар ма тексеру
    const columnExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'process_data' 
        AND column_name = 'mode'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (columnExists[0].exists) {
      console.log('⚠️  Баған "mode" қазірдің өзінде бар. Migration өткізілмейді.');
      return;
    }

    // ENUM типін құру (егер жоқ болса)
    const enumExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'enum_process_data_mode'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!enumExists[0].exists) {
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_process_data_mode" AS ENUM ('manual', 'auto', 'emergency');`
      );
    }

    // mode бағанын қайтару
    await queryInterface.addColumn('process_data', 'mode', {
      type: Sequelize.DataTypes.ENUM('manual', 'auto', 'emergency'),
      allowNull: false,
      defaultValue: 'manual',
      comment: 'Жұмыс режимі'
    });
  }
};
