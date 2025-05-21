
const { Router } = require('express');
const Location = require('../models/Location');
const { protect, admin, superAdmin } = require('../middleware/authMiddleware');

const router = Router();

// Get all locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.findAll();
    res.json(locations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single location
router.get('/:id', async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    res.json(location);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a location (Super Admin only)
router.post('/', protect, superAdmin, async (req, res) => {
  try {
    const { name, address, description, imageUrl, phone, email, whatsappNumber } = req.body;
    
    const location = await Location.create({
      name,
      address,
      description,
      imageUrl,
      phone,
      email,
      whatsappNumber
    });
    
    res.status(201).json(location);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update a location (Super Admin only)
router.put('/:id', protect, superAdmin, async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    const { name, address, description, imageUrl, phone, email, whatsappNumber } = req.body;
    
    location.name = name || location.name;
    location.address = address || location.address;
    location.description = description !== undefined ? description : location.description;
    location.imageUrl = imageUrl || location.imageUrl;
    location.phone = phone || location.phone;
    location.email = email || location.email;
    location.whatsappNumber = whatsappNumber || location.whatsappNumber;
    
    await location.save();
    
    res.json(location);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a location (Super Admin only)
router.delete('/:id', protect, superAdmin, async (req, res) => {
  try {
    const location = await Location.findByPk(req.params.id);
    
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    
    await location.destroy();
    
    res.json({ message: 'Location removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
