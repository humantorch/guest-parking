const request = require('supertest');
const express = require('express');
const { bookingValidationRules, handleValidationErrors } = require('../middleware/validation');

// Create a test app
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

describe('Booking Validation Tests', () => {
  describe('Valid booking data', () => {
    it('should pass validation with complete valid data', async () => {
      const validData = {
        date: '2025-12-25',
        spot_number: 3,
        first_name: 'John',
        last_name: 'Doe',
        unit_number: '101',
        email: 'john@example.com',
        guest_name: 'Jane Smith',
        vehicle_type: 'Sedan',
        license_plate: 'ABC123'
      };

      const response = await request(app)
        .post('/test-booking')
        .send(validData)
        .expect(200);

      expect(response.body.message).toBe('Validation passed!');
      expect(response.body.data).toEqual(validData);
    });

    it('should pass validation with minimal required data', async () => {
      const minimalData = {
        date: '2025-12-25',
        spot_number: 1,
        first_name: 'John',
        unit_number: '101',
        email: 'john@example.com',
        guest_name: 'Jane',
        vehicle_type: 'Car',
        license_plate: 'ABC123'
      };

      const response = await request(app)
        .post('/test-booking')
        .send(minimalData)
        .expect(200);

      expect(response.body.message).toBe('Validation passed!');
    });
  });

  describe('Date validation', () => {
    it('should reject past dates', async () => {
      const pastDateData = {
        date: '2020-01-01',
        spot_number: 1,
        first_name: 'John',
        unit_number: '101',
        email: 'john@example.com',
        guest_name: 'Jane',
        vehicle_type: 'Car',
        license_plate: 'ABC123'
      };

      const response = await request(app)
        .post('/test-booking')
        .send(pastDateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'date',
          message: 'Cannot book dates in the past'
        })
      );
    });

    it('should reject dates more than 6 months in advance', async () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 7);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const futureDateData = {
        date: futureDateStr,
        spot_number: 1,
        first_name: 'John',
        unit_number: '101',
        email: 'john@example.com',
        guest_name: 'Jane',
        vehicle_type: 'Car',
        license_plate: 'ABC123'
      };

      const response = await request(app)
        .post('/test-booking')
        .send(futureDateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'date',
          message: 'Cannot book more than 6 months in advance'
        })
      );
    });

    it('should reject invalid date format', async () => {
      const invalidDateData = {
        date: 'invalid-date',
        spot_number: 1,
        first_name: 'John',
        unit_number: '101',
        email: 'john@example.com',
        guest_name: 'Jane',
        vehicle_type: 'Car',
        license_plate: 'ABC123'
      };

      const response = await request(app)
        .post('/test-booking')
        .send(invalidDateData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'date',
          message: 'Date must be a valid ISO date (YYYY-MM-DD)'
        })
      );
    });
  });

  describe('Spot number validation', () => {
    it('should reject spot numbers outside 1-7 range', async () => {
      const invalidSpotData = {
        date: '2025-12-25',
        spot_number: 99,
        first_name: 'John',
        unit_number: '101',
        email: 'john@example.com',
        guest_name: 'Jane',
        vehicle_type: 'Car',
        license_plate: 'ABC123'
      };

      const response = await request(app)
        .post('/test-booking')
        .send(invalidSpotData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'spot_number',
          message: 'Spot number must be between 1 and 7'
        })
      );
    });

    it('should accept valid spot numbers', async () => {
      for (let spot = 1; spot <= 7; spot++) {
        const validSpotData = {
          date: '2025-12-25',
          spot_number: spot,
          first_name: 'John',
          unit_number: '101',
          email: 'john@example.com',
          guest_name: 'Jane',
          vehicle_type: 'Car',
          license_plate: 'ABC123'
        };

        const response = await request(app)
          .post('/test-booking')
          .send(validSpotData)
          .expect(200);

        expect(response.body.message).toBe('Validation passed!');
      }
    });
  });

  describe('Name validation', () => {
    it('should reject names with invalid characters', async () => {
      const invalidNameData = {
        date: '2025-12-25',
        spot_number: 1,
        first_name: 'John123', // Numbers not allowed
        unit_number: '101',
        email: 'john@example.com',
        guest_name: 'Jane',
        vehicle_type: 'Car',
        license_plate: 'ABC123'
      };

      const response = await request(app)
        .post('/test-booking')
        .send(invalidNameData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'first_name',
          message: 'First name can only contain letters, spaces, hyphens, and apostrophes'
        })
      );
    });

    it('should accept names with valid characters', async () => {
      const validNames = ['John', 'Mary-Jane', "O'Connor", 'Jean Pierre'];
      
      for (const name of validNames) {
        const validNameData = {
          date: '2025-12-25',
          spot_number: 1,
          first_name: name,
          unit_number: '101',
          email: 'john@example.com',
          guest_name: 'Jane',
          vehicle_type: 'Car',
          license_plate: 'ABC123'
        };

        const response = await request(app)
          .post('/test-booking')
          .send(validNameData)
          .expect(200);

        expect(response.body.message).toBe('Validation passed!');
      }
    });
  });

  describe('Email validation', () => {
    it('should reject invalid email formats', async () => {
      const invalidEmails = ['invalid', 'test@', '@example.com', 'test..test@example.com'];
      
      for (const email of invalidEmails) {
        const invalidEmailData = {
          date: '2025-12-25',
          spot_number: 1,
          first_name: 'John',
          unit_number: '101',
          email: email,
          guest_name: 'Jane',
          vehicle_type: 'Car',
          license_plate: 'ABC123'
        };

        const response = await request(app)
          .post('/test-booking')
          .send(invalidEmailData)
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toContainEqual(
          expect.objectContaining({
            field: 'email',
            message: 'Email must be a valid email address'
          })
        );
      }
    });

    it('should accept valid email formats', async () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'test+tag@example.org'];
      
      for (const email of validEmails) {
        const validEmailData = {
          date: '2025-12-25',
          spot_number: 1,
          first_name: 'John',
          unit_number: '101',
          email: email,
          guest_name: 'Jane',
          vehicle_type: 'Car',
          license_plate: 'ABC123'
        };

        const response = await request(app)
          .post('/test-booking')
          .send(validEmailData)
          .expect(200);

        expect(response.body.message).toBe('Validation passed!');
      }
    });
  });

  describe('License plate validation', () => {
    it('should reject license plates with invalid characters', async () => {
      const invalidPlates = ['ABC@123', 'ABC_123', 'abc123', 'ABC123!'];
      
      for (const plate of invalidPlates) {
        const invalidPlateData = {
          date: '2025-12-25',
          spot_number: 1,
          first_name: 'John',
          unit_number: '101',
          email: 'john@example.com',
          guest_name: 'Jane',
          vehicle_type: 'Car',
          license_plate: plate
        };

        const response = await request(app)
          .post('/test-booking')
          .send(invalidPlateData)
          .expect(400);

        expect(response.body.error).toBe('Validation failed');
        expect(response.body.details).toContainEqual(
          expect.objectContaining({
            field: 'license_plate',
            message: 'License plate can only contain uppercase letters, numbers, hyphens, and spaces'
          })
        );
      }
    });

    it('should accept valid license plate formats', async () => {
      const validPlates = ['ABC123', 'ABC-123', 'ABC 123', '123ABC'];
      
      for (const plate of validPlates) {
        const validPlateData = {
          date: '2025-12-25',
          spot_number: 1,
          first_name: 'John',
          unit_number: '101',
          email: 'john@example.com',
          guest_name: 'Jane',
          vehicle_type: 'Car',
          license_plate: plate
        };

        const response = await request(app)
          .post('/test-booking')
          .send(validPlateData)
          .expect(200);

        expect(response.body.message).toBe('Validation passed!');
      }
    });
  });

  describe('Required fields validation', () => {
    it('should reject when required fields are missing', async () => {
      const incompleteData = {
        date: '2025-12-25',
        // Missing spot_number, first_name, email, etc.
      };

      const response = await request(app)
        .post('/test-booking')
        .send(incompleteData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.length).toBeGreaterThan(0);
      
      // Check for specific required field errors
      const fieldNames = response.body.details.map(d => d.field);
      expect(fieldNames).toContain('spot_number');
      expect(fieldNames).toContain('first_name');
      expect(fieldNames).toContain('email');
    });
  });
}); 