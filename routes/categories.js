
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll();
    
    // Count products in each category
    for (let category of categories) {
      const productCount = await Product.count({
        where: { categoryId: category.id }
      });
      category.dataValues.productCount = productCount;
    }
    
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single category
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{ model: Product }]
    });
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a category (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, description, imageUrl } = req.body;
    
    const category = await Category.create({
      name,
      description,
      imageUrl
    });
    
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a category (Admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const { name, description, imageUrl } = req.body;
    
    category.name = name || category.name;
    category.description = description || category.description;
    category.imageUrl = imageUrl !== undefined ? imageUrl : category.imageUrl;
    
    await category.save();
    
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a category (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Check if category has products
    const productCount = await Product.count({
      where: { categoryId: category.id }
    });
    
    if (productCount > 0) {
      return res.status(400).json({ message: 'Cannot delete category with associated products' });
    }
    
    await category.destroy();
    
    res.json({ message: 'Category removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
