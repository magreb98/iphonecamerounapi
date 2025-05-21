
const { DataTypes } = require('sequelize');
const { sequelize } = require('../index.js');
const Product = require('./Product');
const ProductImage = require('./ProductImage.js');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.TEXT
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true
});

// Define associations
Category.hasMany(Product, { foreignKey: 'categoryId' });
Product.belongsTo(Category, { foreignKey: 'categoryId' });
Product.hasMany(ProductImage, {foreignKey: 'productId' });
ProductImage.belongsTo(Product, { foreignKey: 'productId'})

module.exports = Category;
