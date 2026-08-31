// aiScore service tests
const axios = require('axios');

// Manual mock for axios using var to avoid temporal dead zone
var mockAxiosPost = jest.fn();
jest.mock('axios', () => ({
  post: mockAxiosPost,
}));

describe('AI Score Service', () => {
  let scoreDefect, scoreBatch, generateSchedule, explainScore;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env.AI_SERVICE_URL = 'http://localhost:8000';
    mockAxiosPost.mockReset();
    ({ scoreDefect, scoreBatch, generateSchedule, explainScore } = require('../../src/services/aiScore'));
  });

  describe('scoreDefect', () => {
    const mockTask = {
      id: 'task-1',
      source_system: 'tms',
      severity: 'critical',
      task_type: 'rail_fracture',
      department: 'TMS',
      description: 'Rail fracture',
      criticality: 'critical',
      asset_criticality: 'critical',
    };

    it('calls AI service with correct payload', async () => {
      mockAxiosPost.mockResolvedValue({ data: { priority_score: 90 } });

      const result = await scoreDefect(mockTask);

      expect(mockAxiosPost).toHaveBeenCalledWith('http://localhost:8000/score-defect', expect.objectContaining({
        task_id: 'task-1',
        source_system: 'tms',
        severity: 'critical',
        task_type: 'rail_fracture',
        department: 'TMS',
        description: 'Rail fracture',
        asset_type: 'track',
        criticality: 'critical',
        asset_criticality: 'critical',
        days_overdue: 0,
        corridor_traffic: 0,
        asset_age_years: 0,
        total_past_defects: 0,
      }), { timeout: 10000 });

      expect(result).toEqual({ priority_score: 90 });
    });

    it('uses default values for missing fields', async () => {
      const minimalTask = { id: 'task-1', source_system: 'smms', severity: 'medium', department: 'smms' };
      mockAxiosPost.mockResolvedValue({ data: { priority_score: 50 } });

      await scoreDefect(minimalTask);

      expect(mockAxiosPost).toHaveBeenCalledWith('http://localhost:8000/score-defect', expect.objectContaining({
        asset_type: 'signal',
        criticality: 'medium',
        asset_criticality: 'medium',
        department: 'smms',
      }), { timeout: 10000 });
    });

    it('defaults asset_type to track for TMS department (uppercase)', async () => {
      const tmsTask = { id: 'task-1', source_system: 'tms', severity: 'high', department: 'TMS' };
      mockAxiosPost.mockResolvedValue({ data: { priority_score: 60 } });

      await scoreDefect(tmsTask);

      expect(mockAxiosPost).toHaveBeenCalledWith('http://localhost:8000/score-defect', expect.objectContaining({
        asset_type: 'track',
        department: 'TMS',
      }), { timeout: 10000 });
    });
  });

  describe('scoreBatch', () => {
    it('sends array of defects to AI service', async () => {
      const defects = [
        { task_id: '1', severity: 'high' },
        { task_id: '2', severity: 'low' },
      ];
      mockAxiosPost.mockResolvedValue({ data: [{ priority_score: 80 }, { priority_score: 30 }] });

      const result = await scoreBatch(defects);

      expect(mockAxiosPost).toHaveBeenCalledWith('http://localhost:8000/score-batch', defects, { timeout: 10000 });
      expect(result).toEqual([{ priority_score: 80 }, { priority_score: 30 }]);
    });
  });

  describe('generateSchedule', () => {
    it('sends payload to AI service', async () => {
      const payload = { horizon: 'week', tasks: [] };
      mockAxiosPost.mockResolvedValue({ data: { status: 'OPTIMAL', blocks: [] } });

      const result = await generateSchedule(payload);

      expect(mockAxiosPost).toHaveBeenCalledWith('http://localhost:8000/generate-schedule', payload, { timeout: 10000 });
      expect(result).toEqual({ status: 'OPTIMAL', blocks: [] });
    });
  });

  describe('explainScore', () => {
    it('sends defect to explain endpoint', async () => {
      const task = { severity: 'high', days_overdue: 5 };
      mockAxiosPost.mockResolvedValue({ data: { score: 75, explanation: 'High severity' } });

      const result = await explainScore(task);

      expect(mockAxiosPost).toHaveBeenCalledWith('http://localhost:8000/explain-score', expect.objectContaining({
        severity: 'high',
        days_overdue: 5,
        department: 'TMS',
        asset_type: 'track',
      }), { timeout: 10000 });
      expect(result).toEqual({ score: 75, explanation: 'High severity' });
    });
  });
});