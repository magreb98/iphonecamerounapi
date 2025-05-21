
const { DataTypes } = require('sequelize');
const { sequelize } = require('../index.js');

const Configuration = sequelize.define('Configuration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  configKey: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  configValue: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

module.exports = Configuration;
