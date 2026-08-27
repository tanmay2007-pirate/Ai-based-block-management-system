// ============================================================
// src/services/aiScore.js — Call Python AI service to score a task
// Falls back gracefully if AI service is unavailable
// ============================================================
const http = require('http');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Calls POST /score-defect on the Python AI microservice.
 * Returns { priority_score, score_data } or null on failure.
 */
async function scoreDefect(task) {
  return new Promise((resolve) => {
    const body = JSON.stringify({
      task_id: task.id,
      source_system: task.source_system,
      severity: task.severity,
      task_type: task.task_type,
      department: task.department,
      description: task.description,
    });

    const options = {
      hostname: new URL(AI_SERVICE_URL).hostname,
      port: new URL(AI_SERVICE_URL).port || 80,
      path: '/score-defect',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(null);
        }
      });
    });

    req.on('error', () => {
      console.warn('[AI Score] Python AI service unreachable — skipping score update');
      resolve(null);
    });

    req.setTimeout(5000, () => {
      req.destroy();
      console.warn('[AI Score] Timeout reaching Python AI service');
      resolve(null);
    });

    req.write(body);
    req.end();
  });
}

module.exports = { scoreDefect };
