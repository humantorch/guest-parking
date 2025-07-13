const express = require('express');
const { bookingValidationRules, handleValidationErrors } = require('./middleware/validation');

const app = express();
app.use(express.json());

// Test endpoint with validation
app.post('/test-booking', 
  bookingValidationRules,
  handleValidationErrors,
  (req, res) => {
    res.json({ 
      message: 'Validation passed!', 
      data: req.body 
    });
  }
);

// Test endpoint without validation (for comparison)
app.post('/test-booking-no-validation', (req, res) => {
  res.json({ 
    message: 'No validation applied', 
    data: req.body 
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🧪 Validation test server running on port ${PORT}`);
  console.log(`\nTest with valid data:`);
  console.log(`curl -X POST http://localhost:${PORT}/test-booking \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"date":"2025-01-15","spot_number":3,"first_name":"John","last_name":"Doe","unit_number":"101","email":"john@example.com","guest_name":"Jane Smith","vehicle_type":"Sedan","license_plate":"ABC123"}'`);
  
  console.log(`\nTest with invalid data:`);
  console.log(`curl -X POST http://localhost:${PORT}/test-booking \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"date":"invalid-date","spot_number":99,"first_name":"","email":"invalid-email"}'`);
}); 