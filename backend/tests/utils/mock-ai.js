// Mock AI service for testing

let mockAiServer = null;

async function startMockAiServer(port = 8001) {
  if (!mockAiServer) {
    mockAiServer = new MockAiServer(port);
    await mockAiServer.start();
  }
  return mockAiServer;
}

async function stopMockAiServer() {
  if (mockAiServer) {
    await mockAiServer.stop();
    mockAiServer = null;
  }
}

class MockAiServer {
  constructor(port) {
    this.port = port;
    this.server = null;
    this.requestLog = [];
  }

  async start() {
    const express = require('express');
    const app = express();
    app.use(express.json());

    app.get('/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    app.post('/score-defect', (req, res) => {
      this.requestLog.push({ endpoint: 'score-defect', body: req.body });
      const severity = req.body.severity || 'medium';
      const daysOverdue = req.body.days_overdue || 0;
      const criticality = req.body.criticality || 'medium';
      
      let score = 50;
      if (severity === 'critical') score += 30;
      else if (severity === 'high') score += 20;
      else if (severity === 'medium') score += 10;
      
      score += Math.min(daysOverdue * 2, 20);
      
      if (criticality === 'critical') score += 15;
      else if (criticality === 'high') score += 10;
      else if (criticality === 'medium') score += 5;

      res.json({
        priority_score: Math.min(Math.round(score), 100),
        risk_probability: 0.7,
        predicted_repair_duration_hours: 4.5,
        confidence: 'HIGH_CONFIDENCE',
        scoring_method: 'trained_model',
      });
    });

    app.post('/score-batch', (req, res) => {
      this.requestLog.push({ endpoint: 'score-batch', count: req.body.length });
      const results = req.body.map((defect) => ({
        priority_score: 50 + Math.random() * 40,
        risk_probability: 0.5 + Math.random() * 0.4,
        predicted_repair_duration_hours: 2 + Math.random() * 6,
        confidence: 'HIGH_CONFIDENCE',
        scoring_method: 'trained_model',
      }));
      res.json(results);
    });

    app.post('/explain-score', (req, res) => {
      this.requestLog.push({ endpoint: 'explain-score', body: req.body });
      res.json({
        score: { priority_score: 75 },
        feature_contributions: ['critical severity', 'high traffic corridor'],
        explanation: 'High priority because: critical severity, high traffic corridor',
        explanation_method: 'shap_tree_explainer',
        shap_values: { severity: 0.3, traffic_level: 0.25, criticality: 0.2 },
      });
    });

    app.post('/generate-schedule', (req, res) => {
      this.requestLog.push({ endpoint: 'generate-schedule', body: req.body });
      const tasks = req.body.tasks || [];
      const blocks = tasks.slice(0, 3).map((task, i) => ({
        start_time: new Date(Date.now() + (i + 1) * 86400000).toISOString(),
        end_time: new Date(Date.now() + (i + 1) * 86400000 + 7200000).toISOString(),
        corridor: task.corridor || 'CSMT-Kalyan',
        duration_hours: 2,
        actual_work_hours: 2,
        task_ids: [task.task_id],
        departments: [task.department],
      }));

      res.json({
        status: 'OPTIMAL',
        blocks,
        unscheduled_tasks: [],
        critical_unscheduled: [],
        metrics: {
          maintenance_tasks_completed: blocks.length,
          separate_block_windows: blocks.length,
          track_downtime_hours: blocks.length * 2,
          asset_availability: { network_average: 95, by_corridor: {} },
        },
      });
    });

    return new Promise((resolve) => {
      this.server = app.listen(this.port, () => {
        console.log(`[MOCK AI] Server running on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop() {
    if (this.server) {
      await new Promise((resolve) => this.server.close(() => resolve()));
      this.server = null;
    }
  }

  getRequestLog() {
    return this.requestLog;
  }

  clearRequestLog() {
    this.requestLog = [];
  }
}

function createMockAiResponse(overrides = {}) {
  return {
    priority_score: 75,
    risk_probability: 0.7,
    predicted_repair_duration_hours: 4.5,
    confidence: 'HIGH_CONFIDENCE',
    scoring_method: 'trained_model',
    ...overrides,
  };
}

module.exports = {
  startMockAiServer,
  stopMockAiServer,
  MockAiServer,
  createMockAiResponse,
};