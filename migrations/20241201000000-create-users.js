'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Таблица бар ма тексеру
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists[0].exists) {
      console.log('⚠️  Таблица "users" қазірдің өзінде бар. Migration өткізілмейді.');
      return;
    }

    // ENUM типін құру (егер жоқ болса)
    const enumExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'enum_users_role'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!enumExists[0].exists) {
      await queryInterface.sequelize.query(
        `CREATE TYPE "enum_users_role" AS ENUM ('admin', 'engineer-technologist', 'operator');`
      );
    }

    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Пайдаланушы аты'
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Пароль (хештелген)'
      },
      role: {
        type: Sequelize.DataTypes.ENUM('admin', 'engineer-technologist', 'operator'),
        allowNull: false,
        defaultValue: 'operator',
        comment: 'Пайдаланушы рөлі'
      },
      fullName: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Толық аты'
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Белсенділік мәртебесі'
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

    // username бірегей индексі (unique constraint арқылы автоматты құрылады, бірақ қосымша индекс қосайық)
    const usernameIndexExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND (indexname LIKE '%username%' OR indexname = 'users_username')
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!usernameIndexExists[0].exists) {
      await queryInterface.addIndex('users', ['username'], {
        unique: true,
        name: 'users_username'
      });
    }

    // role индексі бар ма тексеру
    const roleIndexExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND (indexname LIKE '%role%' OR indexname = 'users_role')
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!roleIndexExists[0].exists) {
      await queryInterface.addIndex('users', ['role'], {
        name: 'users_role'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Таблица бар ма тексеру
    const tableExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (tableExists[0].exists) {
      await queryInterface.dropTable('users');
    }

    // ENUM типін жою (егер басқа жерде қолданылмаса)
    const enumExists = await queryInterface.sequelize.query(
      `SELECT EXISTS (
        SELECT FROM pg_type 
        WHERE typname = 'enum_users_role'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (enumExists[0].exists) {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role";');
    }
  }
};

