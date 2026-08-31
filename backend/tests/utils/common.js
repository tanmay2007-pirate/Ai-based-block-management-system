// Common test utilities
const { getTestPrisma, cleanupTestData, createTestUser, createTestAsset, generateTestJWT, createAuthHeaders } = require('./test-db');
const { startMockAiServer, stopMockAiServer, createMockAiResponse } = require('./mock-ai');

const testUtils = {
  getTestPrisma,
  cleanupTestData,
  createTestUser,
  createTestAsset,
  generateTestJWT,
  createAuthHeaders,
  startMockAiServer,
  stopMockAiServer,
  createMockAiResponse,
};

async function setupTestApp() {
  const express = require('express');
  const app = express();
  app.use(express.json());
  return app;
}

function mockSocketIO() {
  const events = new Map();
  
  return {
    on: (event, callback) => {
      if (!events.has(event)) events.set(event, []);
      events.get(event).push(callback);
    },
    emit: (event, data) => {
      if (events.has(event)) {
        events.get(event).forEach(cb => cb(data));
      }
    },
    getEvents: () => events,
    clearEvents: () => events.clear(),
  };
}

function createMockRequest(overrides = {}) {
  return {
    headers: {},
    body: {},
    query: {},
    params: {},
    user: { id: 'test-user', role: 'engineering', department: 'TMS' },
    app: {
      get: () => mockSocketIO(),
    },
    ...overrides,
  };
}

function createMockResponse() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res;
}

function createMockNext() {
  return jest.fn();
}

const testRoles = {
  admin: { id: '1', role: 'admin', department: 'ADMIN' },
  engineering: { id: '2', role: 'engineering', department: 'TMS' },
  traction: { id: '3', role: 'traction', department: 'TDMS' },
  signal: { id: '4', role: 'signal', department: 'SMMS' },
  control_office: { id: '5', role: 'control_office', department: 'COA' },
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  testUtils,
  setupTestApp,
  mockSocketIO,
  createMockRequest,
  createMockResponse,
  createMockNext,
  testRoles,
  sleep,
};