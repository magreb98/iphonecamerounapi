
const { Router } = require('express');
const Product = require('../models/Product');
const Category = require('../models/Category');
const ProductImage = require('../models/ProductImage');
const { protect, admin } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save to uploads/products directory
    cb(null, path.join(__dirname, '../uploads/products'));
  },
  filename: function (req, file, cb) {
    // Use a unique filename: timestamp-originalname
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    const filetypes = /jpeg|jpg|png|gif|webp/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  }
});

// Get all products with pagination
router.get('/', async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const offset = (page - 1) * limit;
    
    // Category filter
    const categoryId = req.query.category ? parseInt(req.query.category) : null;
    
    // Build the where clause
    const whereClause = {};
    if (categoryId) {
      whereClause.categoryId = categoryId;
    }
    
    // Get total count for pagination
    const count = await Product.count({ where: whereClause });
    
    // Fetch products with pagination
    const products = await Product.findAll({
      where: whereClause,
      limit,
      offset,
      include: [
        { model: Category, attributes: ['name'] },
        { model: ProductImage, attributes: ['id', 'imageUrl', 'isMainImage'] }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      products,
      pagination: {
        total: count,
        page,
        limit,
        pages: Math.ceil(count / limit),
        hasMore: page < Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        { model: Category, attributes: ['name'] },
        { model: ProductImage, attributes: ['id', 'imageUrl', 'isMainImage'] }
      ]
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a product (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, price, imageUrl, categoryId, quantity, inStock, isOnPromotion, promotionPrice, promotionEndDate } = req.body;
    
    const product = await Product.create({
      name,
      price,
      imageUrl,
      categoryId,
      quantity,
      inStock,
      isOnPromotion: isOnPromotion || false,
      promotionPrice,
      promotionEndDate
    });
    
    // Create a main product image
    await ProductImage.create({
      productId: product.id,
      imageUrl: product.imageUrl,
      isMainImage: true
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Upload product images
router.post('/:id/images', protect, admin, upload.array('images', 5), async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByPk(productId);
    
    if (!product) {
      // Delete uploaded files if product doesn't exist
      for (const file of req.files) {
        fs.unlinkSync(file.path);
      }
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const imageData = [];
    const baseUrl = `${req.protocol}://${req.get('host')}/uploads/products/`;
    
    for (const file of req.files) {
      // Create relative URL
      const imageUrl = baseUrl + path.basename(file.path);
      
      // Determine if this is the first image (main image)
      const isMainImage = imageData.length === 0;
      
      // Create image record
      const image = await ProductImage.create({
        productId,
        imageUrl,
        isMainImage
      });
      
      imageData.push(image);
      
      // If this is the first image, set it as the main product image
      if (isMainImage) {
        product.imageUrl = imageUrl;
        await product.save();
      }
    }
    
    res.status(201).json({ images: imageData });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(400).json({ message: error.message });
  }
});

// Set a product image as main image
router.patch('/:productId/images/:imageId/main', protect, admin, async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    
    // Check if product and image exist
    const product = await Product.findByPk(productId);
    const image = await ProductImage.findOne({
      where: { id: imageId, productId }
    });
    
    if (!product || !image) {
      return res.status(404).json({ message: 'Product or image not found' });
    }
    
    // Reset all images for this product to not main
    await ProductImage.update(
      { isMainImage: false },
      { where: { productId } }
    );
    
    // Set the selected image as main
    image.isMainImage = true;
    await image.save();
    
    // Update product's main image URL
    product.imageUrl = image.imageUrl;
    await product.save();
    
    res.json({ message: 'Main image updated', image });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a product image
router.delete('/:productId/images/:imageId', protect, admin, async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    
    const image = await ProductImage.findOne({
      where: { id: imageId, productId }
    });
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    // Extract filename from URL
    const imageUrl = image.imageUrl;
    const filename = imageUrl.split('/').pop();
    const filePath = path.join(__dirname, '../uploads/products', filename);
    
    // Check if this is the main image
    if (image.isMainImage) {
      // Find another image to set as main
      const anotherImage = await ProductImage.findOne({
        where: { 
          productId,
          id: { [Op.ne]: imageId } // not equal to the current image
        }
      });
      
      if (anotherImage) {
        // Set another image as main
        anotherImage.isMainImage = true;
        await anotherImage.save();
        
        // Update product's main image
        const product = await Product.findByPk(productId);
        product.imageUrl = anotherImage.imageUrl;
        await product.save();
      }
    }
    
    // Delete image record from database
    await image.destroy();
    
    // Delete physical file if it exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    res.json({ message: 'Image removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a product (Admin only)
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const { name, price, imageUrl, categoryId, quantity, inStock, isOnPromotion, promotionPrice, promotionEndDate } = req.body;
    
    product.name = name || product.name;
    product.price = price || product.price;
    product.imageUrl = imageUrl || product.imageUrl;
    product.categoryId = categoryId || product.categoryId;
    product.quantity = quantity !== undefined ? quantity : product.quantity;
    product.inStock = inStock !== undefined ? inStock : product.inStock;
    product.isOnPromotion = isOnPromotion !== undefined ? isOnPromotion : product.isOnPromotion;
    product.promotionPrice = promotionPrice !== undefined ? promotionPrice : product.promotionPrice;
    product.promotionEndDate = promotionEndDate !== undefined ? promotionEndDate : product.promotionEndDate;
    
    await product.save();
    
    // If imageUrl changed, update or create the main product image
    if (imageUrl) {
      const mainImage = await ProductImage.findOne({
        where: { productId: product.id, isMainImage: true }
      });
      
      if (mainImage) {
        mainImage.imageUrl = imageUrl;
        await mainImage.save();
      } else {
        await ProductImage.create({
          productId: product.id,
          imageUrl,
          isMainImage: true
        });
      }
    }
    
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Toggle promotion status (Admin only)
router.patch('/:id/toggle-promotion', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const { isOnPromotion, promotionPrice, promotionEndDate } = req.body;
    
    product.isOnPromotion = isOnPromotion !== undefined ? isOnPromotion : !product.isOnPromotion;
    
    if (product.isOnPromotion) {
      product.promotionPrice = promotionPrice || product.promotionPrice;
      product.promotionEndDate = promotionEndDate || product.promotionEndDate;
    } else {
      product.promotionPrice = null;
      product.promotionEndDate = null;
    }
    
    await product.save();
    
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a product (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: ProductImage }]
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Delete all product images from storage
    for (const image of product.ProductImages || []) {
      const imageUrl = image.imageUrl;
      const filename = imageUrl.split('/').pop();
      const filePath = path.join(__dirname, '../uploads/products', filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await product.destroy();
    
    res.json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
