const request = require('supertest');
const app = require('../index');

// Get the mocked database function
const getPool = require('../db');
const mockPool = getPool();

describe('API Endpoint Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Set up default mock responses
    mockPool.query.mockResolvedValue({
      rows: [],
      rowCount: 0
    });
  });

  describe('GET /api/bookings/availability', () => {
    it('should return available spots for a valid date', async () => {
      // Mock the database to return some booked spots
      mockPool.query.mockResolvedValue({
        rows: [{ spot_number: 1 }, { spot_number: 3 }],
        rowCount: 2
      });

      const response = await request(app)
        .get('/api/bookings/availability')
        .query({ date: '2025-12-25' })
        .expect(200);

      expect(response.body).toHaveProperty('availableSpots');
      expect(Array.isArray(response.body.availableSpots)).toBe(true);
      expect(response.body.availableSpots).toEqual([2, 4, 5, 6, 7]); // Spots 1 and 3 are booked
    });

    it('should reject invalid date format', async () => {
      const response = await request(app)
        .get('/api/bookings/availability')
        .query({ date: 'invalid-date' })
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'date',
          message: 'Date must be a valid ISO date (YYYY-MM-DD)'
        })
      );
    });

    it('should reject missing date parameter', async () => {
      const response = await request(app)
        .get('/api/bookings/availability')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'date',
          message: 'Date parameter is required'
        })
      );
    });
  });

  describe('POST /api/bookings (single booking)', () => {
    const validBookingData = {
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

    it('should create a booking with valid data', async () => {
      // Mock successful insert
      mockPool.query.mockResolvedValue({
        rows: [],
        rowCount: 1
      });

      const response = await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(201);

      expect(response.body.message).toBe('Booking confirmed');
    });

    it('should reject booking with invalid data', async () => {
      const invalidData = {
        date: '2020-01-01', // Past date
        spot_number: 99, // Invalid spot
        first_name: 'John123', // Invalid name
        email: 'invalid-email', // Invalid email
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details.length).toBeGreaterThan(0);
    });

    it('should reject duplicate booking for same date and spot', async () => {
      // Mock first successful insert
      mockPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 1
      });

      // Mock second insert to fail with duplicate key error
      mockPool.query.mockRejectedValueOnce({
        code: '23505',
        message: 'duplicate key value violates unique constraint'
      });

      // First booking
      await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(201);

      // Duplicate booking
      const response = await request(app)
        .post('/api/bookings')
        .send(validBookingData)
        .expect(409);

      expect(response.body.error).toBe('Spot already booked');
    });
  });

  describe('POST /api/bookings/batch (weekend booking)', () => {
    const validWeekendData = {
      dates: ['2025-12-26', '2025-12-27', '2025-12-28'], // Fri, Sat, Sun
      spot_number: 4,
      first_name: 'Jane',
      last_name: 'Smith',
      unit_number: '202',
      email: 'jane@example.com',
      guest_name: 'Bob Johnson',
      vehicle_type: 'SUV',
      license_plate: 'XYZ789'
    };

    it('should create weekend bookings with valid data', async () => {
      // Mock the client connection for batch operations
      const mockClient = {
        query: jest.fn(),
        release: jest.fn()
      };
      
      mockPool.connect.mockResolvedValue(mockClient);
      
      // Mock the transaction and conflict checking
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN transaction
        .mockResolvedValueOnce({ rowCount: 0 }) // No conflicts for first date
        .mockResolvedValueOnce({ rowCount: 1 }) // Insert first date
        .mockResolvedValueOnce({ rowCount: 0 }) // No conflicts for second date
        .mockResolvedValueOnce({ rowCount: 1 }) // Insert second date
        .mockResolvedValueOnce({ rowCount: 0 }) // No conflicts for third date
        .mockResolvedValueOnce({ rowCount: 1 }) // Insert third date
        .mockResolvedValueOnce({}); // COMMIT transaction

      const response = await request(app)
        .post('/api/bookings/batch')
        .send(validWeekendData)
        .expect(201);

      expect(response.body.message).toBe('Full weekend booking confirmed!');
    });

    it('should reject weekend booking with non-consecutive dates', async () => {
      const invalidWeekendData = {
        ...validWeekendData,
        dates: ['2025-12-26', '2025-12-28'] // Missing Saturday
      };

      const response = await request(app)
        .post('/api/bookings/batch')
        .send(invalidWeekendData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          message: 'Weekend dates must be consecutive'
        })
      );
    });

    it('should reject weekend booking with past dates', async () => {
      const pastWeekendData = {
        ...validWeekendData,
        dates: ['2020-12-26', '2020-12-27', '2020-12-28']
      };

      const response = await request(app)
        .post('/api/bookings/batch')
        .send(pastWeekendData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('GET /api/bookings (admin)', () => {
    it('should return all bookings', async () => {
      // Mock successful query with sample bookings
      mockPool.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            date: '2025-12-25',
            spot_number: 1,
            first_name: 'John',
            last_name: 'Doe'
          }
        ],
        rowCount: 1
      });

      const response = await request(app)
        .get('/api/bookings')
        .expect(200);

      expect(response.body).toHaveProperty('bookings');
      expect(Array.isArray(response.body.bookings)).toBe(true);
    });
  });

  describe('DELETE /api/bookings/:id (admin)', () => {
    it('should reject invalid booking ID', async () => {
      const response = await request(app)
        .delete('/api/bookings/invalid-id')
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'id',
          message: 'Booking ID must be a positive integer'
        })
      );
    });

    it('should reject missing booking ID', async () => {
      const response = await request(app)
        .delete('/api/bookings/')
        .expect(404); // Route not found

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/bookings/ping (health check)', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/bookings/ping')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('DB connection is healthy');
    });
  });

  describe('CORS and Security', () => {
    it('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/api/bookings')
        .set('Origin', 'http://localhost:3000')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    it('should reject requests with invalid content type', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Content-Type', 'text/plain')
        .send('invalid data')
        .expect(415);

      expect(response.body.error).toBe('Unsupported Media Type');
    });

    it('should reject oversized requests', async () => {
      const largeData = 'x'.repeat(1024 * 1024 + 1); // 1MB + 1 byte
      
      const response = await request(app)
        .post('/api/bookings')
        .set('Content-Length', largeData.length.toString())
        .send(largeData)
        .expect(413);

      expect(response.body.error).toBe('Request entity too large');
    });
  });

  describe('Rate Limiting', () => {
    it('should allow requests within rate limit', async () => {
      // Make multiple requests quickly
      const promises = Array(5).fill().map(() =>
        request(app)
          .get('/api/bookings/availability')
          .query({ date: '2025-12-25' })
      );

      const responses = await Promise.all(promises);
      
      // All should succeed (rate limiting disabled in test environment)
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
}); 