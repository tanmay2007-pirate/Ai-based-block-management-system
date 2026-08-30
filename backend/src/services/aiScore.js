// ============================================================
// src/services/aiScore.js — Call Python AI service to score a task
// Falls back gracefully if AI service is unavailable
// ============================================================
const axios = require('axios');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

/**
 * Calls POST /score-defect on the Python AI microservice.
 * Returns { priority_score, score_data } or null on failure.
 */
async function postToAi(path, payload) {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}${path}`, payload, { timeout: 10000 });
    return response.data;
  } catch (error) {
    const message = error.response ? `AI service returned ${error.response.status}` : error.message;
    const serviceError = new Error(`AI service unavailable: ${message}`);
    serviceError.status = 503;
    throw serviceError;
  }
}

async function scoreDefect(task) {
  return postToAi('/score-defect', {
    task_id: task.id,
    source_system: task.source_system,
    severity: task.severity,
    task_type: task.task_type,
    department: task.department,
    description: task.description,
    asset_type: task.asset_type || (task.department === 'TMS' ? 'track' : 'signal'),
    criticality: task.criticality || task.asset_criticality || 'medium',
    asset_criticality: task.asset_criticality || task.criticality || 'medium',
    days_overdue: task.days_overdue || 0,
    corridor_traffic: task.traffic_level || task.corridor_traffic || 0,
    asset_age_years: task.asset_age_years || 0,
    total_past_defects: task.total_past_defects || 0,
  });
}

function generateSchedule(payload) {
  return postToAi('/generate-schedule', payload);
}

async function explainScore(task) {
  return postToAi('/explain-score', {
    severity: task.severity || 'medium',
    days_overdue: task.days_overdue || 0,
    asset_criticality: task.asset_criticality || task.criticality || 'medium',
    criticality: task.criticality || task.asset_criticality || 'medium',
    corridor_traffic: task.traffic_level || task.corridor_traffic || 0,
    department: task.department || 'TMS',
    asset_type: task.asset_type || 'track',
    asset_age_years: task.asset_age_years || 0,
    total_past_defects: task.total_past_defects || 0,
  });
}

async function scoreBatch(defects) {
  return postToAi('/score-batch', defects);
}

module.exports = { scoreDefect, scoreBatch, generateSchedule, explainScore };
