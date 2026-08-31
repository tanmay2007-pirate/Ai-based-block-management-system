// roleCheck middleware tests
const { roleCheck, departmentCheck } = require('../../src/middleware/roleCheck');

describe('RoleCheck Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { user: null };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  describe('roleCheck', () => {
    it('returns 401 when no user', () => {
      const middleware = roleCheck(['engineering']);
      middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Not authenticated',
      });
    });

    it('returns 403 when role not allowed', () => {
      mockReq.user = { id: '1', role: 'traction', department: 'TDMS' };
      const middleware = roleCheck(['engineering']);
      middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Role traction not permitted. Required: engineering',
      });
    });

    it('allows when role matches', () => {
      mockReq.user = { id: '1', role: 'engineering', department: 'TMS' };
      const middleware = roleCheck(['engineering']);
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('allows admin for any role', () => {
      mockReq.user = { id: '1', role: 'admin', department: 'ADMIN' };
      const middleware = roleCheck(['engineering']);
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('accepts array of roles', () => {
      mockReq.user = { id: '1', role: 'traction', department: 'TDMS' };
      const middleware = roleCheck(['engineering', 'traction', 'signal']);
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('accepts single role as string', () => {
      mockReq.user = { id: '1', role: 'engineering', department: 'TMS' };
      const middleware = roleCheck('engineering');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('departmentCheck', () => {
    it('returns 401 when no user', () => {
      const middleware = departmentCheck('TMS');
      middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('allows admin for any department', () => {
      mockReq.user = { id: '1', role: 'admin', department: 'ADMIN' };
      const middleware = departmentCheck('TMS');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('allows matching department role', () => {
      mockReq.user = { id: '1', role: 'engineering', department: 'TMS' };
      const middleware = departmentCheck('TMS');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('allows traction for TDMS', () => {
      mockReq.user = { id: '1', role: 'traction', department: 'TDMS' };
      const middleware = departmentCheck('TDMS');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('allows signal for SMMS', () => {
      mockReq.user = { id: '1', role: 'signal', department: 'SMMS' };
      const middleware = departmentCheck('SMMS');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('allows control_office for COA', () => {
      mockReq.user = { id: '1', role: 'control_office', department: 'COA' };
      const middleware = departmentCheck('COA');
      middleware(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('rejects wrong department', () => {
      mockReq.user = { id: '1', role: 'engineering', department: 'TMS' };
      const middleware = departmentCheck('TDMS');
      middleware(mockReq, mockRes, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Forbidden',
        message: 'Only TDMS members can perform this action',
      });
    });
  });
});