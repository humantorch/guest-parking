const { body, param, query, validationResult } = require('express-validator');

// Validation rules for booking data
const bookingValidationRules = [
  // Date validation
  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO date (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (date < today) {
        throw new Error('Cannot book dates in the past');
      }
      
      // Optional: limit booking to 6 months in advance
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      if (date > sixMonthsFromNow) {
        throw new Error('Cannot book more than 6 months in advance');
      }
      
      return true;
    }),

  // Spot number validation
  body('spot_number')
    .notEmpty()
    .withMessage('Spot number is required')
    .isInt({ min: 1, max: 7 })
    .withMessage('Spot number must be between 1 and 7'),

  // Name validation
  body('first_name')
    .notEmpty()
    .withMessage('First name is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('First name can only contain letters, spaces, hyphens, and apostrophes'),

  body('last_name')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Last name must be 50 characters or less')
    .matches(/^[a-zA-Z\s\-']*$/)
    .withMessage('Last name can only contain letters, spaces, hyphens, and apostrophes'),

  // Unit number validation
  body('unit_number')
    .notEmpty()
    .withMessage('Unit number is required')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Unit number must be between 1 and 10 characters')
    .matches(/^[a-zA-Z0-9\-]+$/)
    .withMessage('Unit number can only contain letters, numbers, and hyphens'),

  // Email validation
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail()
    .isLength({ max: 254 })
    .withMessage('Email must be 254 characters or less'),

  // Guest name validation
  body('guest_name')
    .notEmpty()
    .withMessage('Guest name is required')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Guest name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Guest name can only contain letters, spaces, hyphens, and apostrophes'),

  // Vehicle type validation
  body('vehicle_type')
    .notEmpty()
    .withMessage('Vehicle type is required')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Vehicle type must be between 1 and 50 characters')
    .matches(/^[a-zA-Z\s\-']+$/)
    .withMessage('Vehicle type can only contain letters, spaces, hyphens, and apostrophes'),

  // License plate validation
  body('license_plate')
    .notEmpty()
    .withMessage('License plate is required')
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('License plate must be between 1 and 20 characters')
    .matches(/^[A-Z0-9\-\s]+$/)
    .withMessage('License plate can only contain uppercase letters, numbers, hyphens, and spaces')
];

// Validation rules for batch booking
const batchBookingValidationRules = [
  // Dates array validation
  body('dates')
    .notEmpty()
    .withMessage('Dates array is required')
    .isArray({ min: 1, max: 7 })
    .withMessage('Dates must be an array with 1-7 dates')
    .custom((dates) => {
      if (!Array.isArray(dates)) {
        throw new Error('Dates must be an array');
      }
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      for (const dateStr of dates) {
        if (!dateStr || typeof dateStr !== 'string') {
          throw new Error('Each date must be a valid string');
        }
        
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          throw new Error('Each date must be a valid date');
        }
        
        if (date < today) {
          throw new Error('Cannot book dates in the past');
        }
        
        // Check if dates are consecutive (for weekend bookings)
        if (dates.length > 1) {
          const sortedDates = dates.map(d => new Date(d)).sort((a, b) => a - b);
          for (let i = 1; i < sortedDates.length; i++) {
            const diffTime = sortedDates[i] - sortedDates[i - 1];
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays !== 1) {
              throw new Error('Weekend dates must be consecutive');
            }
          }
        }
      }
      
      return true;
    }),

  // Reuse other validation rules from bookingValidationRules
  ...bookingValidationRules.filter(rule => 
    rule.field !== 'date' // Exclude date validation since we handle it in dates array
  )
];

// Validation rules for availability query
const availabilityValidationRules = [
  query('date')
    .notEmpty()
    .withMessage('Date parameter is required')
    .isISO8601()
    .withMessage('Date must be a valid ISO date (YYYY-MM-DD)')
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
      return true;
    })
];

// Validation rules for delete operation
const deleteValidationRules = [
  param('id')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isInt({ min: 1 })
    .withMessage('Booking ID must be a positive integer')
];

// Middleware to check validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Sanitization middleware
const sanitizeInput = (req, res, next) => {
  // Sanitize string fields
  const stringFields = ['first_name', 'last_name', 'unit_number', 'guest_name', 'vehicle_type', 'license_plate'];
  
  stringFields.forEach(field => {
    if (req.body[field]) {
      req.body[field] = req.body[field].trim();
    }
  });
  
  // Normalize email
  if (req.body.email) {
    req.body.email = req.body.email.toLowerCase().trim();
  }
  
  // Ensure spot_number is an integer
  if (req.body.spot_number) {
    req.body.spot_number = parseInt(req.body.spot_number, 10);
  }
  
  next();
};

module.exports = {
  bookingValidationRules,
  batchBookingValidationRules,
  availabilityValidationRules,
  deleteValidationRules,
  handleValidationErrors,
  sanitizeInput
}; 