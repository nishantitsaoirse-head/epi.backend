require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/epi-project')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Sample products
const products = [
  {
    name: 'Smartphone X Pro',
    description: 'Latest flagship smartphone with advanced features and high-performance camera',
    price: 48999,
    images: ['https://via.placeholder.com/500x500.png?text=Smartphone+X+Pro'],
    category: 'Electronics',
    stock: 50,
    minimumSavingDays: 30,
    isActive: true
  },
  {
    name: 'Laptop Ultra',
    description: 'Thin and light laptop with powerful performance for work and entertainment',
    price: 62999,
    images: ['https://via.placeholder.com/500x500.png?text=Laptop+Ultra'],
    category: 'Electronics',
    stock: 25,
    minimumSavingDays: 45,
    isActive: true
  },
  {
    name: 'Smart Watch Series 5',
    description: 'Track your fitness, health, and stay connected with this advanced smartwatch',
    price: 18999,
    images: ['https://via.placeholder.com/500x500.png?text=Smart+Watch'],
    category: 'Accessories',
    stock: 100,
    minimumSavingDays: 20,
    isActive: true
  },
  {
    name: 'Wireless Earbuds Pro',
    description: 'Premium sound quality with active noise cancellation and long battery life',
    price: 9999,
    images: ['https://via.placeholder.com/500x500.png?text=Wireless+Earbuds'],
    category: 'Accessories',
    stock: 150,
    minimumSavingDays: 15,
    isActive: true
  },
  {
    name: 'Ultimate Tech Bundle',
    description: 'Get the Smartphone X Pro and Wireless Earbuds Pro together at a special price',
    price: 56999,
    images: ['https://via.placeholder.com/500x500.png?text=Tech+Bundle'],
    category: 'Electronics',
    isCombo: true,
    stock: 20,
    minimumSavingDays: 40,
    isActive: true
  }
];

// Reset database and insert sample data
async function initDB() {
  try {
    // Clear existing collections
    await mongoose.connection.dropDatabase();
    console.log('Dropped existing database');
    
    // Insert products
    const createdProducts = await Product.insertMany(products);
    console.log(`Created ${createdProducts.length} products`);
    
    // Set up combo products relationship
    if (createdProducts.length >= 5) {
      // Find the combo product and update its comboProducts array
      const comboProduct = await Product.findById(createdProducts[4]._id);
      
      comboProduct.comboProducts = [
        { product: createdProducts[0]._id, quantity: 1 },
        { product: createdProducts[3]._id, quantity: 1 }
      ];
      
      await comboProduct.save();
      console.log('Updated combo product relationships');
    }
    
    console.log('Database initialized successfully!');
    console.log('You can now run the create-admin.js script to add an admin user.');
    
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    // Close the MongoDB connection
    mongoose.connection.close();
  }
}

console.log('Initializing database with sample data...');
initDB(); 