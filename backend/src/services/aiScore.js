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
function fallbackPriorityScore(task = {}) {
  const severityMap = { critical: 32, high: 26, medium: 18, low: 10 };
  const criticalityMap = { critical: 22, high: 16, medium: 10, low: 4 };
  const severity = severityMap[task.severity?.toLowerCase?.() || 'medium'] || 18;
  const criticality = criticalityMap[task.asset_criticality?.toLowerCase?.() || task.criticality?.toLowerCase?.() || 'medium'] || 10;
  const overdue = Math.min((task.days_overdue || 0) * 2.2, 18);
  const traffic = Math.min((task.corridor_traffic || 0) * 1.5, 15);
  const age = Math.min((task.asset_age_years || 0) * 2.5, 10);
  const defectHistory = Math.min((task.total_past_defects || 0) * 1.4, 12);
  return Math.min(Math.max(Math.round(severity + criticality + overdue + traffic + age + defectHistory), 0), 100);
}

function fallbackExplanation(task = {}) {
  const score = fallbackPriorityScore(task);
  return {
    priority_score: score,
    summary: `${task.department || 'Maintenance'} task is ranked ${score} because the asset is ${task.asset_criticality || task.criticality || 'medium'} and the defect severity is ${task.severity || 'medium'}.`,
    factors: [
      { label: 'Severity', value: task.severity || 'medium', score: score >= 70 ? 28 : 18 },
      { label: 'Asset criticality', value: task.asset_criticality || task.criticality || 'medium', score: score >= 70 ? 20 : 12 },
      { label: 'Days overdue', value: task.days_overdue || 0, score: score >= 70 ? 18 : 10 },
      { label: 'Traffic impact', value: task.corridor_traffic || 0, score: score >= 70 ? 17 : 9 },
      { label: 'Repair history', value: task.total_past_defects || 0, score: score >= 70 ? 17 : 9 },
    ],
    fallback: true,
  };
}

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
  try {
    return await postToAi('/score-defect', {
      task_id: task.id,
      source_system: task.source_system,
      severity: task.severity,
      task_type: task.task_type,
      department: task.department,
      description: task.description,
      asset_type: task.asset_type || (task.department === 'TMS' ? 'track' : 'signal'),
      criticality: task.criticality || 'critical',
      asset_criticality: task.criticality || 'critical',
      days_overdue: task.days_overdue || 0,
      corridor_traffic: task.traffic_level || 0,
      asset_age_years: task.asset_age_years || 0,
      total_past_defects: task.total_past_defects || 0,
    });
  } catch (error) {
    return { priority_score: fallbackPriorityScore(task), score_data: fallbackExplanation(task) };
  }
}

function generateSchedule(payload) {
  return postToAi('/generate-schedule', payload).catch(() => ({ fallback: true, message: 'AI scheduling unavailable, using local planning logic.' }));
}

async function explainScore(task) {
  try {
    return await postToAi('/explain-score', {
      severity: task.severity || 'medium',
      days_overdue: task.days_overdue || 0,
      asset_criticality: task.criticality || 'medium',
      corridor_traffic: task.traffic_level || 0,
      department: task.department || 'TMS',
      asset_type: task.asset_type || 'track',
      asset_age_years: task.asset_age_years || 0,
      total_past_defects: task.total_past_defects || 0,
    });
  } catch (error) {
    return fallbackExplanation(task);
  }
}

async function scoreBatch(defects) {
  try {
    return await postToAi('/score-batch', defects);
  } catch (error) {
    return defects.map((defect) => ({
      ...defect,
      priority_score: fallbackPriorityScore(defect),
      score_data: fallbackExplanation(defect),
    }));
  }
}

module.exports = { scoreDefect, scoreBatch, generateSchedule, explainScore, fallbackPriorityScore };
