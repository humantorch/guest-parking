// Test setup file
process.env.NODE_ENV = 'test';
process.env.DISABLE_RATE_LIMIT = 'true'; // Disable rate limiting for tests

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.RESEND_API_KEY = 'test_key';
process.env.FROM_EMAIL = 'test@example.com';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';

// Mock the database module
jest.mock('../db', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn()
    }))
  };
  
  // Set up default mock responses
  mockPool.query.mockResolvedValue({
    rows: [],
    rowCount: 0
  });
  
  return jest.fn(() => mockPool);
});

// Mock Resend
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: jest.fn().mockResolvedValue({ id: 'test-email-id' })
    }
  }))
}));

// Increase timeout for tests
jest.setTimeout(10000); 