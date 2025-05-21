
const User = require('./models/User');
const Category = require('./models/Category');
const Product = require('./models/Product');
const bcrypt = require('bcryptjs');

// Demo data for database seeding
async function seedDatabase() {
  console.log('Checking if database needs seeding...');
  
  try {
    // Check if we already have data
    const userCount = await User.count();
    const categoryCount = await Category.count();
    
    if (userCount > 0 && categoryCount > 0) {
      console.log('Database already has data, skipping seed process');
      return;
    }
    
    console.log('Seeding database with demo data...');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      email: 'admin@iphonecameroun.com',
      password: hashedPassword,
      isAdmin: true
    });
    console.log('Admin user created');
    
    // Create categories
    const categories = await Category.bulkCreate([
      { name: 'iPhones', description: 'Smartphones Apple iPhone' },
      { name: 'iPads', description: 'Tablettes Apple iPad' },
      { name: 'Macbooks', description: 'Ordinateurs portables Apple MacBook' },
      { name: 'Accessoires', description: 'Accessoires pour produits Apple' }
    ]);
    console.log('Categories created');
    
    // Create products
    const products = [
      {
        name: 'iPhone 14 Pro',
        price: 899000,
        imageUrl: 'https://placehold.co/600x400?text=iPhone+14+Pro',
        categoryId: 1,
        inStock: true,
        quantity: 10
      },
      {
        name: 'iPhone 15',
        price: 999000,
        imageUrl: 'https://placehold.co/600x400?text=iPhone+15',
        categoryId: 1,
        inStock: true,
        quantity: 5
      },
      {
        name: 'iPad Air',
        price: 699000,
        imageUrl: 'https://placehold.co/600x400?text=iPad+Air',
        categoryId: 2,
        inStock: true,
        quantity: 8
      },
      {
        name: 'MacBook Pro 16"',
        price: 1899000,
        imageUrl: 'https://placehold.co/600x400?text=MacBook+Pro',
        categoryId: 3,
        inStock: true,
        quantity: 3
      },
      {
        name: 'AirPods Pro',
        price: 199000,
        imageUrl: 'https://placehold.co/600x400?text=AirPods+Pro',
        categoryId: 4,
        inStock: true,
        quantity: 15
      },
      {
        name: 'Chargeur MagSafe',
        price: 49000,
        imageUrl: 'https://placehold.co/600x400?text=MagSafe+Charger',
        categoryId: 4,
        inStock: true,
        quantity: 20
      }
    ];
    
    await Product.bulkCreate(products);
    console.log('Products created');
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

module.exports = seedDatabase;
