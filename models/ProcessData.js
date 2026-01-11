const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ProcessData = sequelize.define('ProcessData', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // Кіріс параметрлері (x1-x6)
    x1: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      comment: 'Шикізат шығыны (т/тәулік)'
    },
    x2: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      comment: 'Шикізат тығыздығы (т/м³)'
    },
    x3: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Шикізат температурасы (°C)'
    },
    x4: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Реактор температурасы (°C)'
    },
    x5: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      comment: 'Реактор қысымы (кгс/см²)'
    },
    x6: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Катализатор шығыны (т/тәулік)'
    },
    // Шығыс параметрлері (y1-y2)
    y1: {
      type: DataTypes.DECIMAL(10, 3),
      allowNull: false,
      comment: 'Бензин көлемі (%)'
    },
    y2: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      comment: 'Бензин тығыздығы'
    },

    // Жасалу және жаңарту уақыты
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Жасалу уақыты'
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      comment: 'Жаңарту уақыты'
    }
  }, {
    tableName: 'process_data',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        fields: ['createdAt']
      }
    ],
    hooks: {
      beforeUpdate: (instance) => {
        instance.updatedAt = new Date();
      }
    }
  });

  return ProcessData;
};
