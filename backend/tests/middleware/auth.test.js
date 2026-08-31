// Auth middleware tests
const auth = require('../../src/middleware/auth');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'test-secret-key-for-testing-only';

describe('Auth Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('Missing Authorization header', () => {
    it('returns 401 when no Authorization header', () => {
      auth(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No Bearer token provided',
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when Authorization header is not Bearer', () => {
      mockReq.headers.authorization = 'Basic dXNlcjpwYXNz';
      auth(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'No Bearer token provided',
      });
    });
  });

  describe('Valid token', () => {
    it('attaches user to request and calls next', () => {
      const token = jwt.sign({ user_id: '123', role: 'engineering', department: 'TMS' }, JWT_SECRET);
      mockReq.headers.authorization = `Bearer ${token}`;

      auth(mockReq, mockRes, mockNext);

      expect(mockReq.user).toEqual({
        id: '123',
        role: 'engineering',
        department: 'TMS',
      });
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('handles all valid roles', () => {
      const roles = ['engineering', 'traction', 'signal', 'control_office', 'admin'];
      roles.forEach(role => {
        const token = jwt.sign({ user_id: '123', role, department: 'TMS' }, JWT_SECRET);
        mockReq.headers.authorization = `Bearer ${token}`;
        mockNext.mockClear();

        auth(mockReq, mockRes, mockNext);

        expect(mockReq.user.role).toBe(role);
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('Expired token', () => {
    it('returns 401 with "Token expired" message', () => {
      const token = jwt.sign(
        { user_id: '123', role: 'engineering', department: 'TMS' },
        JWT_SECRET,
        { expiresIn: '-1h' }
      );
      mockReq.headers.authorization = `Bearer ${token}`;

      auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Token expired',
      });
    });
  });

  describe('Invalid token', () => {
    it('returns 401 with "Invalid token" message', () => {
      mockReq.headers.authorization = 'Bearer invalid.token.here';
      auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    });

    it('returns 401 for malformed token', () => {
      mockReq.headers.authorization = 'Bearer not.a.jwt';
      auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    });

    it('returns 401 for token with wrong secret', () => {
      const token = jwt.sign(
        { user_id: '123', role: 'engineering', department: 'TMS' },
        'wrong-secret'
      );
      mockReq.headers.authorization = `Bearer ${token}`;
      auth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Invalid token',
      });
    });
  });
});