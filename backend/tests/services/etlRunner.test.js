// etlRunner service tests - testing pure functions only
const { buildSyntheticData, scenarioForDay } = require('../../src/services/etlRunner');

describe('ETL Runner - Pure Functions', () => {
  describe('buildSyntheticData', () => {
    it('generates deterministic data with same seed', () => {
      const data1 = buildSyntheticData({ days: 2, seed: 42 });
      const data2 = buildSyntheticData({ days: 2, seed: 42 });
      
      expect(data1.assets.length).toBe(data2.assets.length);
      expect(data1.tmsData.length).toBe(data2.tmsData.length);
      expect(data1.tdmsData.length).toBe(data2.tdmsData.length);
      expect(data1.smmsData.length).toBe(data2.smmsData.length);
    });

    it('includes all required asset fields', () => {
      const data = buildSyntheticData({ days: 1, seed: 42 });
      
      const asset = data.assets[0];
      expect(asset).toHaveProperty('asset_id');
      expect(asset).toHaveProperty('asset_code');
      expect(asset).toHaveProperty('asset_type');
      expect(asset).toHaveProperty('department');
      expect(asset).toHaveProperty('zone');
      expect(asset).toHaveProperty('section');
      expect(asset).toHaveProperty('criticality');
      expect(asset).toHaveProperty('traffic_level');
      expect(['low', 'medium', 'high', 'critical']).toContain(asset.criticality);
    });

    it('includes all required TMS defect fields', () => {
      const data = buildSyntheticData({ days: 1, seed: 42 });
      
      const defect = data.tmsData[0];
      expect(defect).toHaveProperty('id');
      expect(defect).toHaveProperty('asset_id');
      expect(defect).toHaveProperty('defect_type');
      expect(defect).toHaveProperty('severity');
      expect(['low', 'medium', 'high', 'critical']).toContain(defect.severity);
      expect(defect).toHaveProperty('reported_at');
      expect(defect).toHaveProperty('preferred_start_time');
      expect(defect).toHaveProperty('preferred_end_time');
    });

    it('includes all required TDMS defect fields', () => {
      const data = buildSyntheticData({ days: 1, seed: 42 });
      
      const defect = data.tdmsData[0];
      expect(defect).toHaveProperty('id');
      expect(defect).toHaveProperty('asset_id');
      expect(defect).toHaveProperty('loco_number');
      expect(defect).toHaveProperty('loco_type');
      expect(defect).toHaveProperty('defect_type');
      expect(defect).toHaveProperty('severity');
      expect(['low', 'medium', 'high', 'critical']).toContain(defect.severity);
      expect(defect).toHaveProperty('reported_at');
      expect(defect).toHaveProperty('preferred_start_time');
      expect(defect).toHaveProperty('preferred_end_time');
    });

    it('includes all required SMMS defect fields', () => {
      const data = buildSyntheticData({ days: 1, seed: 42 });
      
      const defect = data.smmsData[0];
      expect(defect).toHaveProperty('id');
      expect(defect).toHaveProperty('asset_id');
      expect(defect).toHaveProperty('signal_id');
      expect(defect).toHaveProperty('signal_type');
      expect(defect).toHaveProperty('location_km');
      expect(defect).toHaveProperty('defect_type');
      expect(defect).toHaveProperty('severity');
      expect(['low', 'medium', 'high', 'critical']).toContain(defect.severity);
      expect(defect).toHaveProperty('reported_at');
      expect(defect).toHaveProperty('preferred_start_time');
      expect(defect).toHaveProperty('preferred_end_time');
    });
  });

  describe('scenarioForDay', () => {
    it('returns scenario based on day index and seed', () => {
      const s1 = scenarioForDay(0, 42);
      const s2 = scenarioForDay(0, 42);
      
      expect(s1.name).toBe(s2.name);
      expect(s1.maintenanceMultiplier).toBe(s2.maintenanceMultiplier);
    });

    it('returns different scenarios for different days', () => {
      const s1 = scenarioForDay(0, 42);
      const s2 = scenarioForDay(1, 42);
      
      // Should cycle through different scenarios
      expect(s1.name).not.toBe(s2.name);
    });

    it('cycles through all scenarios', () => {
      const scenarios = new Set();
      for (let i = 0; i < 20; i++) {
        scenarios.add(scenarioForDay(i, 42).name);
      }
      expect(scenarios.size).toBeGreaterThan(1);
    });
  });
});