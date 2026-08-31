// rateLimiter middleware tests
const express = require('express');
const request = require('supertest');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: {
      error: 'Too Many Requests',
      message: 'Too many authentication attempts, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'test-ip',
    skip: (req) => req.path === '/me',
  });
}

function createRegisterLimiter() {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
      error: 'Too Many Requests',
      message: 'Too many registration attempts, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'test-ip',
  });
}

function createApiLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
      error: 'Too Many Requests',
      message: 'Too many requests, please try again later',
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => req.ip || 'test-ip',
  });
}

describe('Rate Limiter Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('authLimiter', () => {
    it('allows requests under limit', async () => {
      const limiter = createAuthLimiter();
      app.post('/test', limiter, (req, res) => res.json({ ok: true }));
      
      for (let i = 0; i < 5; i++) {
        const res = await request(app).post('/test').send({ test: i });
        expect(res.status).toBe(200);
      }
    });

    it('returns 429 when limit exceeded', async () => {
      const limiter = createAuthLimiter();
      app.post('/test', limiter, (req, res) => res.json({ ok: true }));
      
      for (let i = 0; i < 21; i++) {
        const res = await request(app).post('/test').send({ test: i });
        if (i < 20) {
          expect(res.status).toBe(200);
        } else {
          expect(res.status).toBe(429);
          expect(res.body.error).toBe('Too Many Requests');
          expect(res.body.message).toContain('authentication attempts');
        }
      }
    });

    it('skips /me endpoint', async () => {
      const limiter = createAuthLimiter();
      app.get('/me', limiter, (req, res) => res.json({ ok: true }));
      
      for (let i = 0; i < 25; i++) {
        const res = await request(app).get('/me');
        expect(res.status).toBe(200);
      }
    });

    it('includes standard headers', async () => {
      const limiter = createAuthLimiter();
      app.post('/test', limiter, (req, res) => res.json({ ok: true }));
      const res = await request(app).post('/test');
      
      expect(res.headers).toHaveProperty('ratelimit-limit');
      expect(res.headers).toHaveProperty('ratelimit-remaining');
      expect(res.headers).toHaveProperty('ratelimit-reset');
    });
  });

  describe('registerLimiter', () => {
    it('allows requests under limit', async () => {
      const limiter = createRegisterLimiter();
      app.post('/register', limiter, (req, res) => res.json({ ok: true }));
      
      for (let i = 0; i < 5; i++) {
        const res = await request(app).post('/register').send({ test: i });
        expect(res.status).toBe(200);
      }
    });

    it('returns 429 when limit exceeded', async () => {
      const limiter = createRegisterLimiter();
      app.post('/register', limiter, (req, res) => res.json({ ok: true }));
      
      for (let i = 0; i < 6; i++) {
        const res = await request(app).post('/register').send({ test: i });
        if (i < 5) {
          expect(res.status).toBe(200);
        } else {
          expect(res.status).toBe(429);
          expect(res.body.error).toBe('Too Many Requests');
          expect(res.body.message).toContain('registration attempts');
        }
      }
    });
  });

  describe('apiLimiter', () => {
    it('allows requests under limit', async () => {
      const limiter = createApiLimiter();
      app.use('/api', limiter);
      app.get('/api/test', (req, res) => res.json({ ok: true }));
      
      for (let i = 0; i < 10; i++) {
        const res = await request(app).get('/api/test');
        expect(res.status).toBe(200);
      }
    });

    it('returns 429 when limit exceeded', async () => {
      const limiter = createApiLimiter();
      app.use('/api', limiter);
      app.get('/api/test', (req, res) => res.json({ ok: true }));
      
      for (let i = 0; i < 101; i++) {
        const res = await request(app).get('/api/test');
        if (i < 100) {
          expect(res.status).toBe(200);
        } else {
          expect(res.status).toBe(429);
          expect(res.body.error).toBe('Too Many Requests');
          expect(res.body.message).toContain('Too many requests');
        }
      }
    });
  });
});