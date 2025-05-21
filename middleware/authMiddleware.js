
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      
      // Verify token
      const decoded = jwt.verify(token, 'secret_key_should_be_in_env');
      
      // Get user from the token
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] }
      });
      
      next();
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }
  
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && (req.user.isAdmin || req.user.isSuperAdmin)) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const superAdmin = (req, res, next) => {
  if (req.user && req.user.isSuperAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as a super admin' });
  }
};

// Middleware pour vérifier si l'utilisateur est associé à l'emplacement
const locationAccess = (req, res, next) => {
  const locationId = parseInt(req.params.locationId) || parseInt(req.body.locationId);
  
  if (req.user && req.user.isSuperAdmin) {
    // Super admin a accès à tous les emplacements
    next();
  } else if (req.user && req.user.isAdmin && req.user.locationId === locationId) {
    // Admin a accès uniquement à son emplacement
    next();
  } else {
    res.status(401).json({ message: 'Not authorized for this location' });
  }
};

module.exports = { protect, admin, superAdmin, locationAccess };
