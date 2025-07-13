const { vi } = require('vitest');

// Mock database for testing
const mockPool = {
  query: vi.fn(),
  connect: vi.fn(() => ({
    query: vi.fn(),
    release: vi.fn()
  }))
};

// Mock the db module
vi.mock('../../db', () => ({
  default: () => mockPool
}));

// Export the mock for use in tests
module.exports = { mockPool }; 