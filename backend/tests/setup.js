// Test setup file - Plain JavaScript
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/railway_test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.AI_SERVICE_URL = 'http://localhost:8001';
process.env.CRON_TIMEZONE = 'Asia/Kolkata';

jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  createTestUser: async (overrides = {}) => {
    const { getTestPrisma, createTestUser } = require('./tests/utils/test-db');
    return createTestUser(getTestPrisma(), overrides);
  },
  createTestAsset: async (overrides = {}) => {
    const { getTestPrisma, createTestAsset } = require('./tests/utils/test-db');
    return createTestAsset(getTestPrisma(), overrides);
  },
  generateTestJWT: (payload = {}) => {
    const { generateTestJWT } = require('./tests/utils/test-db');
    return generateTestJWT(payload);
  },
  createAuthHeaders: (token) => {
    const { createAuthHeaders } = require('./tests/utils/test-db');
    return createAuthHeaders(token);
  },
};