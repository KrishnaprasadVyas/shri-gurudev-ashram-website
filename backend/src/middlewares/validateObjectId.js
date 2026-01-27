const mongoose = require("mongoose");

/**
 * Middleware to validate MongoDB ObjectId in route params
 * Returns 400 Bad Request for invalid ObjectIds instead of 500 CastError
 * 
 * @param {string} paramName - The route parameter name to validate (default: 'id')
 */
const validateObjectId = (paramName = "id") => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id) {
      return next(); // Let the controller handle missing ID
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${paramName} format`,
      });
    }
    
    next();
  };
};

module.exports = validateObjectId;
