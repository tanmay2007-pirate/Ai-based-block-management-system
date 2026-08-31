// validate middleware tests
const { validate, registerSchema, loginSchema, tmsDefectSchema, tdmsDefectSchema, smmsDefectSchema, blockPlanSchema, blockDemandSchema, taskStatusSchema, scheduleGenerateSchema, emergencyDefectSchema, emergencyNotificationSchema, queryPaginationSchema, idParamSchema } = require('../../src/middleware/validate');

describe('Validate Middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(() => {
    mockReq = { body: {}, query: {}, params: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  const runValidation = (schema) => validate(schema)(mockReq, mockRes, mockNext);

  describe('registerSchema', () => {
    it('passes with valid data', () => {
      mockReq.body = { name: 'Test User', email: 'test@example.com', password: 'password123', role: 'engineering' };
      runValidation(registerSchema);
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validated.body).toEqual(mockReq.body);
    });

    it('fails with missing name', () => {
      mockReq.body = { email: 'test@example.com', password: 'password123', role: 'engineering' };
      runValidation(registerSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation Error' }));
    });

    it('fails with invalid email', () => {
      mockReq.body = { name: 'Test', email: 'invalid', password: 'password123', role: 'engineering' };
      runValidation(registerSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('fails with short password', () => {
      mockReq.body = { name: 'Test', email: 'test@example.com', password: '123', role: 'engineering' };
      runValidation(registerSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('fails with invalid role', () => {
      mockReq.body = { name: 'Test', email: 'test@example.com', password: 'password123', role: 'invalid' };
      runValidation(registerSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('loginSchema', () => {
    it('passes with valid credentials', () => {
      mockReq.body = { email: 'test@example.com', password: 'password123' };
      runValidation(loginSchema);
      expect(mockNext).toHaveBeenCalled();
    });

    it('fails with missing email', () => {
      mockReq.body = { password: 'password123' };
      runValidation(loginSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('fails with invalid email format', () => {
      mockReq.body = { email: 'invalid', password: 'password123' };
      runValidation(loginSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('tmsDefectSchema', () => {
    const validTmsDefect = {
      asset_type: 'track',
      defect_type: 'rail_fracture',
      severity: 'critical',
      asset_id: '123e4567-e89b-12d3-a456-426614174000',
      location_km: 10.5,
      description: 'Test defect',
      reported_by: 'inspector',
    };

    it('passes with valid data', () => {
      mockReq.body = validTmsDefect;
      runValidation(tmsDefectSchema);
      expect(mockNext).toHaveBeenCalled();
    });

    it('fails with missing asset_type', () => {
      const { asset_type, ...rest } = validTmsDefect;
      mockReq.body = rest;
      runValidation(tmsDefectSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('fails with missing defect_type', () => {
      const { defect_type, ...rest } = validTmsDefect;
      mockReq.body = rest;
      runValidation(tmsDefectSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('fails with missing severity', () => {
      const { severity, ...rest } = validTmsDefect;
      mockReq.body = rest;
      runValidation(tmsDefectSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('fails with invalid severity', () => {
      mockReq.body = { ...validTmsDefect, severity: 'invalid' };
      runValidation(tmsDefectSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('accepts all valid severity values', () => {
      ['low', 'medium', 'high', 'critical'].forEach(severity => {
        mockReq.body = { ...validTmsDefect, severity };
        mockNext.mockClear();
        runValidation(tmsDefectSchema);
        expect(mockNext).toHaveBeenCalled();
      });
    });
  });

  describe('tdmsDefectSchema', () => {
    const validTdmsDefect = {
      loco_number: 'LOCO-123',
      loco_type: 'electric',
      defect_type: 'pantograph_damage',
      severity: 'high',
      asset_id: '123e4567-e89b-12d3-a456-426614174000',
      depot: 'Bandra',
      description: 'Test defect',
      reported_by: 'technician',
    };

    it('passes with valid data', () => {
      mockReq.body = validTdmsDefect;
      runValidation(tdmsDefectSchema);
      expect(mockNext).toHaveBeenCalled();
    });

    it('requires loco_number', () => {
      const { loco_number, ...rest } = validTdmsDefect;
      mockReq.body = rest;
      runValidation(tdmsDefectSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('requires loco_type', () => {
      const { loco_type, ...rest } = validTdmsDefect;
      mockReq.body = rest;
      runValidation(tdmsDefectSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('smmsDefectSchema', () => {
    const validSmmsDefect = {
      signal_id: 'SIG-123',
      signal_type: 'LED',
      defect_type: 'interlocking_error',
      severity: 'critical',
      asset_id: '123e4567-e89b-12d3-a456-426614174000',
      location_km: 15.2,
      description: 'Test defect',
      reported_by: 'technician',
    };

    it('passes with valid data', () => {
      mockReq.body = validSmmsDefect;
      runValidation(smmsDefectSchema);
      expect(mockNext).toHaveBeenCalled();
    });

    it('requires signal_id', () => {
      const { signal_id, ...rest } = validSmmsDefect;
      mockReq.body = rest;
      runValidation(smmsDefectSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('requires signal_type', () => {
      const { signal_type, ...rest } = validSmmsDefect;
      mockReq.body = rest;
      runValidation(smmsDefectSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('blockPlanSchema', () => {
    const validBlockPlan = {
      section: 'CSMT-Kalyan',
      from_km: 10,
      to_km: 20,
      planned_start: '2026-09-01T02:00:00.000Z',
      planned_end: '2026-09-01T05:00:00.000Z',
      week_start: '2026-08-31T00:00:00.000Z',
      week_end: '2026-09-06T23:59:59.999Z',
      block_demand_id: '123e4567-e89b-12d3-a456-426614174000',
    };

    it('passes with valid data', () => {
      mockReq.body = validBlockPlan;
      runValidation(blockPlanSchema);
      expect(mockNext).toHaveBeenCalled();
    });

    it('fails with missing section', () => {
      const { section, ...rest } = validBlockPlan;
      mockReq.body = rest;
      runValidation(blockPlanSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('fails with invalid datetime format', () => {
      mockReq.body = { ...validBlockPlan, planned_start: 'invalid-date' };
      runValidation(blockPlanSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('blockDemandSchema', () => {
    const validDemand = {
      section: 'CSMT-Kalyan',
      from_km: 10,
      to_km: 20,
      demanded_for: '2026-09-01T02:00:00.000Z',
      duration_hours: 3,
      reason: 'Maintenance work',
    };

    it('passes with valid data', () => {
      mockReq.body = validDemand;
      runValidation(blockDemandSchema);
      expect(mockNext).toHaveBeenCalled();
    });

    it('fails with missing section', () => {
      const { section, ...rest } = validDemand;
      mockReq.body = rest;
      runValidation(blockDemandSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('fails with zero duration', () => {
      mockReq.body = { ...validDemand, duration_hours: 0 };
      runValidation(blockDemandSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('fails with negative duration', () => {
      mockReq.body = { ...validDemand, duration_hours: -1 };
      runValidation(blockDemandSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('taskStatusSchema', () => {
    it('passes with valid status', () => {
      mockReq.body = { status: 'in_progress', notes: 'Started work' };
      mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      runValidation(taskStatusSchema);
      expect(mockNext).toHaveBeenCalled();
    });

    it('accepts all valid statuses', () => {
      ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'].forEach(status => {
        mockReq.body = { status };
        mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
        mockNext.mockClear();
        runValidation(taskStatusSchema);
        expect(mockNext).toHaveBeenCalled();
      });
    });

    it('fails with invalid status', () => {
      mockReq.body = { status: 'invalid' };
      mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      runValidation(taskStatusSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('fails with invalid UUID', () => {
      mockReq.body = { status: 'pending' };
      mockReq.params = { id: 'not-a-uuid' };
      runValidation(taskStatusSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('scheduleGenerateSchema', () => {
    it('passes with valid data', () => {
      mockReq.body = {
        horizon: 'week',
        proposedChanges: { moves: [], combines: [] },
      };
      runValidation(scheduleGenerateSchema);
      expect(mockNext).toHaveBeenCalled();
    });

    it('defaults horizon to week', () => {
      mockReq.body = { proposedChanges: { moves: [], combines: [] } };
      runValidation(scheduleGenerateSchema);
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validated.body.horizon).toBe('week');
    });

    it('fails with invalid horizon', () => {
      mockReq.body = { horizon: 'year', proposedChanges: { moves: [], combines: [] } };
      runValidation(scheduleGenerateSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('validates move structure', () => {
      mockReq.body = {
        horizon: 'week',
        proposedChanges: {
          moves: [{ taskId: '1', newStartTime: 'invalid', corridorId: '1' }],
          combines: [],
        },
      };
      runValidation(scheduleGenerateSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('validates combine structure', () => {
      mockReq.body = {
        horizon: 'week',
        proposedChanges: {
          moves: [],
          combines: [{ taskIds: ['1'], corridorId: '1', startTime: '2026-09-01T02:00:00.000Z', endTime: '2026-09-01T05:00:00.000Z' }],
        },
      };
      runValidation(scheduleGenerateSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('emergencyDefectSchema', () => {
    const validEmergency = {
      asset_id: '123e4567-e89b-12d3-a456-426614174000',
      section: 'CSMT-Kalyan',
      description: 'Critical failure',
    };

    it('passes with valid data', () => {
      mockReq.body = validEmergency;
      runValidation(emergencyDefectSchema);
      expect(mockNext).toHaveBeenCalled();
    });

    it('requires asset_id', () => {
      const { asset_id, ...rest } = validEmergency;
      mockReq.body = rest;
      runValidation(emergencyDefectSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('requires section', () => {
      const { section, ...rest } = validEmergency;
      mockReq.body = rest;
      runValidation(emergencyDefectSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('requires description', () => {
      const { description, ...rest } = validEmergency;
      mockReq.body = rest;
      runValidation(emergencyDefectSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('accepts optional severity', () => {
      mockReq.body = { ...validEmergency, severity: 'high' };
      runValidation(emergencyDefectSchema);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('emergencyNotificationSchema', () => {
    it('passes with valid data', () => {
      mockReq.body = { title: 'Emergency', message: 'Critical issue', related_id: '123' };
      runValidation(emergencyNotificationSchema);
      expect(mockNext).toHaveBeenCalled();
    });

    it('requires title', () => {
      mockReq.body = { message: 'Critical issue' };
      runValidation(emergencyNotificationSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('requires message', () => {
      mockReq.body = { title: 'Emergency' };
      runValidation(emergencyNotificationSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('queryPaginationSchema', () => {
    it('passes with valid query params', () => {
      mockReq.query = { page: '1', limit: '20', department: 'TMS', status: 'pending' };
      runValidation(queryPaginationSchema);
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validated.query.page).toBe(1);
      expect(mockReq.validated.query.limit).toBe(20);
    });

    it('defaults page and limit', () => {
      mockReq.query = {};
      runValidation(queryPaginationSchema);
      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.validated.query.page).toBeUndefined();
      expect(mockReq.validated.query.limit).toBeUndefined();
    });

    it('fails with invalid page', () => {
      mockReq.query = { page: '0' };
      runValidation(queryPaginationSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('fails with limit > 100', () => {
      mockReq.query = { limit: '200' };
      runValidation(queryPaginationSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('idParamSchema', () => {
    it('passes with valid UUID', () => {
      mockReq.params = { id: '123e4567-e89b-12d3-a456-426614174000' };
      runValidation(idParamSchema);
      expect(mockNext).toHaveBeenCalled();
    });

    it('fails with invalid UUID', () => {
      mockReq.params = { id: 'not-a-uuid' };
      runValidation(idParamSchema);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });
});