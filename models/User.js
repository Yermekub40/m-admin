const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Пайдаланушы аты'
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Пароль (хештелген)'
    },
    role: {
      type: DataTypes.ENUM('admin', 'engineer-technologist', 'operator'),
      allowNull: false,
      defaultValue: 'operator',
      comment: 'Пайдаланушы рөлі'
    },
    fullName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Толық аты'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Белсенділік мәртебесі'
    },
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
    tableName: 'users',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['username']
      },
      {
        fields: ['role']
      }
    ],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
        user.updatedAt = new Date();
      }
    }
  });

  // Парольді тексеру әдісі
  User.prototype.checkPassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  // Парольді қауіпсіз формада қайтару (парольді алып тастау)
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    return values;
  };

  return User;
};

