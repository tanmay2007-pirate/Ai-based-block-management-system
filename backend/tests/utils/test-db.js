// Test database setup and utilities
// Uses a separate test database schema

const { PrismaClient } = require('@prisma/client');

let testPrisma = null;

function getTestPrisma() {
  if (!testPrisma) {
    testPrisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
        },
      },
      log: process.env.NODE_ENV === 'test' ? ['error'] : [],
    });
  }
  return testPrisma;
}

async function cleanupTestData(prisma) {
  const models = [
    'maintenanceHistory',
    'blockPlanTrain',
    'conflict',
    'approvedBlockPlan',
    'blockPlan',
    'blockDemand',
    'maintenanceTask',
    'trackMaintenance',
    'tractionMaintenance',
    'signallingMaintenance',
    'trainOperations',
    'asset',
    'notification',
    'auditLog',
    'scheduledTask',
    'user',
  ];

  for (const model of models) {
    try {
      await prisma[model].deleteMany({});
    } catch (e) {
      // Ignore errors for models that might not exist
    }
  }
}

async function createTestUser(prisma, overrides = {}) {
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash('password123', 12);
  
  return prisma.user.create({
    data: {
      name: 'Test User',
      email: `test-${Date.now()}@example.com`,
      password_hash: passwordHash,
      role: 'engineering',
      department: 'TMS',
      ...overrides,
    },
  });
}

async function createTestAsset(prisma, overrides = {}) {
  return prisma.asset.create({
    data: {
      asset_code: `TEST-${Date.now()}`,
      asset_type: 'track',
      name: 'Test Asset',
      department: 'TMS',
      zone: 'CR',
      division: 'CR-Division-1',
      section: 'CSMT-Kalyan',
      station_location: 'CSMT',
      location_km: 10.5,
      gauge: 'BG',
      manufacturer: 'Test Corp',
      installation_date: new Date('2020-01-01'),
      design_life_years: 25,
      criticality: 'high',
      condition_score: 85,
      traffic_level: 150,
      total_past_defects: 5,
      total_past_failures: 1,
      status: 'active',
      replacement_cost_estimate: 1000000,
      ...overrides,
    },
  });
}

function generateTestJWT(payload = {}, secret = process.env.JWT_SECRET || 'test-secret') {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      user_id: 'test-user-id',
      role: 'engineering',
      department: 'TMS',
      ...payload,
    },
    secret,
    { expiresIn: '1h' }
  );
}

function createAuthHeaders(token) {
  const t = token || generateTestJWT();
  return { Authorization: `Bearer ${t}` };
}

module.exports = {
  getTestPrisma,
  cleanupTestData,
  createTestUser,
  createTestAsset,
  generateTestJWT,
  createAuthHeaders,
};