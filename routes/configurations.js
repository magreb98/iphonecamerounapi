
const { Router } = require('express');
const Configuration = require('../models/Configuration');
const { protect, admin } = require('../middleware/authMiddleware');

const router = Router();

// Get all configurations
router.get('/', protect, admin, async (req, res) => {
  try {
    const configurations = await Configuration.findAll();
    res.json(configurations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a configuration by key
router.get('/:key', async (req, res) => {
  try {
    const configuration = await Configuration.findOne({ 
      where: { configKey: req.params.key } 
    });
    
    if (!configuration) {
      // Renvoyer un objet vide mais pas d'erreur 404, laissez le client gérer les valeurs par défaut
      return res.json({ 
        configKey: req.params.key,
        configValue: "",
        description: "Configuration not found" 
      });
    }
    
    res.json(configuration);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create or update a configuration (Admin only)
router.post('/', protect, admin, async (req, res) => {
  try {
    const { configKey, configValue, description } = req.body;
    
    // Check if configuration already exists
    let configuration = await Configuration.findOne({ 
      where: { configKey } 
    });
    
    if (configuration) {
      // Update existing configuration
      configuration.configValue = configValue;
      if (description) configuration.description = description;
      await configuration.save();
    } else {
      // Create new configuration
      configuration = await Configuration.create({
        configKey,
        configValue,
        description
      });
    }
    
    res.status(201).json(configuration);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a configuration (Admin only)
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const configuration = await Configuration.findByPk(req.params.id);
    
    if (!configuration) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    
    await configuration.destroy();
    
    res.json({ message: 'Configuration removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
