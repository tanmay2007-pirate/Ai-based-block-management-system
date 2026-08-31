// etl service tests
const { normalizeTmsDefect, normalizeTdmsDefect, normalizeSmmsDefect } = require('../../src/services/etl');
const { PrismaClient } = require('@prisma/client');

jest.mock('@prisma/client', () => {
  const mockPrisma = {
    maintenanceTask: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  return { PrismaClient: jest.fn(() => mockPrisma) };
});

describe('ETL Service', () => {
  let mockPrisma;
  let mockTx;

  beforeEach(() => {
    jest.clearAllMocks();
    mockTx = {
      maintenanceTask: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };
    mockPrisma = {
      maintenanceTask: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockTx)),
    };
    jest.doMock('../../src/lib/prisma', () => mockPrisma);
  });

  describe('normalizeTmsDefect', () => {
    const mockRecord = {
      id: 'tms-1',
      asset_id: 'asset-1',
      asset_type: 'track',
      location_km: 10.5,
      defect_type: 'rail_fracture',
      severity: 'critical',
      description: 'Rail fracture detected',
      reported_by: 'inspector',
      is_deleted: false,
    };

    it('creates new maintenance task when none exists', async () => {
      mockTx.maintenanceTask.findFirst.mockResolvedValue(null);
      mockTx.maintenanceTask.create.mockResolvedValue({ id: 'task-1', source_system: 'tms', source_id: 'tms-1' });

      const result = await normalizeTmsDefect(mockRecord, mockTx);

      expect(mockTx.maintenanceTask.findFirst).toHaveBeenCalledWith({
        where: { source_system: 'tms', source_id: 'tms-1' },
      });
      expect(mockTx.maintenanceTask.create).toHaveBeenCalledWith({
        data: {
          source_system: 'tms',
          source_id: 'tms-1',
          task_type: 'rail_fracture',
          severity: 'critical',
          description: 'Rail fracture detected',
          location: '10.5 km',
          department: 'TMS',
          asset_id: 'asset-1',
        },
      });
      expect(result.id).toBe('task-1');
    });

    it('updates existing maintenance task', async () => {
      const existingTask = { id: 'task-1', source_system: 'tms', source_id: 'tms-1' };
      mockTx.maintenanceTask.findFirst.mockResolvedValue(existingTask);
      mockTx.maintenanceTask.update.mockResolvedValue({ id: 'task-1' });

      const result = await normalizeTmsDefect(mockRecord, mockTx);

      expect(mockTx.maintenanceTask.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: {
          severity: 'critical',
          description: 'Rail fracture detected',
          location: '10.5 km',
          asset_id: 'asset-1',
          is_deleted: false,
          updated_at: expect.any(Date),
        },
      });
      expect(result.id).toBe('task-1');
    });

    it('handles null location_km', async () => {
      const recordNoLocation = { ...mockRecord, location_km: null };
      mockTx.maintenanceTask.findFirst.mockResolvedValue(null);
      mockTx.maintenanceTask.create.mockResolvedValue({ id: 'task-1' });

      await normalizeTmsDefect(recordNoLocation, mockTx);

      expect(mockTx.maintenanceTask.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ location: null }),
        })
      );
    });

    it('handles deleted record', async () => {
      const deletedRecord = { ...mockRecord, is_deleted: true };
      mockTx.maintenanceTask.findFirst.mockResolvedValue({ id: 'task-1' });
      mockTx.maintenanceTask.update.mockResolvedValue({ id: 'task-1', is_deleted: true });

      const result = await normalizeTmsDefect(deletedRecord, mockTx);

      expect(mockTx.maintenanceTask.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ is_deleted: true }),
        })
      );
    });
  });

  describe('normalizeTdmsDefect', () => {
    const mockRecord = {
      id: 'tdms-1',
      asset_id: 'asset-1',
      loco_number: 'LOCO-123',
      loco_type: 'electric',
      defect_type: 'pantograph_damage',
      severity: 'high',
      description: 'Pantograph wear',
      depot: 'Bandra',
      reported_by: 'technician',
      is_deleted: false,
    };

    it('creates new maintenance task with depot as location', async () => {
      mockTx.maintenanceTask.findFirst.mockResolvedValue(null);
      mockTx.maintenanceTask.create.mockResolvedValue({ id: 'task-1' });

      const result = await normalizeTdmsDefect(mockRecord, mockTx);

      expect(mockTx.maintenanceTask.create).toHaveBeenCalledWith({
        data: {
          source_system: 'tdms',
          source_id: 'tdms-1',
          task_type: 'pantograph_damage',
          severity: 'high',
          description: 'Pantograph wear',
          location: 'Bandra',
          department: 'TDMS',
          asset_id: 'asset-1',
        },
      });
      expect(result.id).toBe('task-1');
    });

    it('uses default prisma when tx not provided', async () => {
      const { PrismaClient } = require('@prisma/client');
      const defaultPrisma = new PrismaClient();
      defaultPrisma.maintenanceTask.findFirst.mockResolvedValue(null);
      defaultPrisma.maintenanceTask.create.mockResolvedValue({ id: 'task-1' });

      const result = await normalizeTdmsDefect(mockRecord);

      expect(defaultPrisma.maintenanceTask.create).toHaveBeenCalled();
      expect(result.id).toBe('task-1');
    });
  });

  describe('normalizeSmmsDefect', () => {
    const mockRecord = {
      id: 'smms-1',
      asset_id: 'asset-1',
      signal_id: 'SIG-123',
      signal_type: 'LED',
      location_km: 15.2,
      defect_type: 'interlocking_error',
      severity: 'critical',
      description: 'Interlocking failure',
      reported_by: 'technician',
      is_deleted: false,
    };

    it('creates new maintenance task with location', async () => {
      mockTx.maintenanceTask.findFirst.mockResolvedValue(null);
      mockTx.maintenanceTask.create.mockResolvedValue({ id: 'task-1' });

      const result = await normalizeSmmsDefect(mockRecord, mockTx);

      expect(mockTx.maintenanceTask.create).toHaveBeenCalledWith({
        data: {
          source_system: 'smms',
          source_id: 'smms-1',
          task_type: 'interlocking_error',
          severity: 'critical',
          description: 'Interlocking failure',
          location: '15.2 km',
          department: 'SMMS',
          asset_id: 'asset-1',
        },
      });
      expect(result.id).toBe('task-1');
    });
  });
});