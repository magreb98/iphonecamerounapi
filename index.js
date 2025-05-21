
const express = require('express');
const cors = require('cors');
const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const productImagesDir = path.join(uploadsDir, 'products');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

if (!fs.existsSync(productImagesDir)) {
  fs.mkdirSync(productImagesDir);
}

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Database connection
const sequelize = new Sequelize('iphone_cameroun', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false
});

// Test DB connection
(async () => {
  try {
    await sequelize.authenticate();
    console.log('MySQL connection established successfully.');
    
    // Import models
    const Product = require('./models/Product');
    const Category = require('./models/Category');
    const User = require('./models/User');
    const ProductImage = require('./models/ProductImage');
    const Configuration = require('./models/Configuration');
    const Location = require('./models/Location');
    
    // Define associations
    Product.hasMany(ProductImage, { foreignKey: 'productId' });
    ProductImage.belongsTo(Product, { foreignKey: 'productId' });
    
    Category.hasMany(Product, { foreignKey: 'categoryId' });
    Product.belongsTo(Category, { foreignKey: 'categoryId' });
    
    Location.hasMany(Product, { foreignKey: 'locationId' });
    Product.belongsTo(Location, { foreignKey: 'locationId' });
    
    Location.hasMany(User, { foreignKey: 'locationId' });
    User.belongsTo(Location, { foreignKey: 'locationId' });
    
    // Sync models with database
    await sequelize.sync({ alter: true });
    console.log('Database synchronized');
    
    // Import routes after models are defined and synced
    const productRoutes = require('./routes/products');
    const categoryRoutes = require('./routes/categories');
    const authRoutes = require('./routes/auth');
    const configRoutes = require('./routes/configurations');
    const locationRoutes = require('./routes/locations');
    
    // Routes
    app.use('/api/products', productRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/auth', authRoutes);
    app.use('/api/configurations', configRoutes);
    app.use('/api/locations', locationRoutes);
    
  } catch (error) {
    console.error('Unable to connect to the database:', error);
  }
})();

// Root route
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { sequelize };
