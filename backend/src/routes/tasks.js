// src/routes/tasks.js — Maintenance task listing & status updates
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { scoreBatch, explainScore } = require('../services/aiScore');

const router = express.Router();

async function loadSourceRecord(task, db = prisma) {
  const source = String(task.source_system || '').toLowerCase();
  if (source === 'tms') return db.trackMaintenance.findUnique({ where: { id: task.source_id } });
  if (source === 'tdms') return db.tractionMaintenance.findUnique({ where: { id: task.source_id } });
  if (source === 'smms') return db.signallingMaintenance.findUnique({ where: { id: task.source_id } });
  return null;
}

function taskFeatures(task, asset, sourceRecord = null) {
  const age = asset && asset.installation_date
    ? Math.max(0, (Date.now() - new Date(asset.installation_date).getTime()) / (365.25 * 86400000))
    : 0;
  const preferredStart = sourceRecord?.preferred_start_time ? new Date(sourceRecord.preferred_start_time) : null;
  const preferredEnd = sourceRecord?.preferred_end_time ? new Date(sourceRecord.preferred_end_time) : null;
  const estimatedHours = preferredStart && preferredEnd && preferredEnd > preferredStart
    ? (preferredEnd - preferredStart) / 3600000
    : task.estimated_hours;
  return {
    severity: task.severity, days_overdue: sourceRecord?.overdue_days || 0,
    asset_criticality: sourceRecord?.criticality || asset?.criticality || 'medium',
    criticality: sourceRecord?.criticality || asset?.criticality || 'medium',
    corridor_traffic: asset?.traffic_level || 0, department: task.department,
    asset_type: asset?.asset_type || (task.department === 'TMS' ? 'track' : 'signal'),
    asset_age_years: age, total_past_defects: asset?.total_past_defects || 0,
    estimated_duration_hours: estimatedHours,
  };
}

// POST /api/tasks/score-all — score pending tasks and persist AI results
router.post('/score-all', auth, roleCheck(['control_office', 'admin']), async (req, res, next) => {
  try {
    const tasks = await prisma.maintenanceTask.findMany({ where: { status: 'pending', is_deleted: false } });
    const assets = await prisma.asset.findMany({ where: { id: { in: tasks.map((task) => task.asset_id).filter(Boolean) } } });
    const byId = new Map(assets.map((asset) => [asset.id, asset]));
    const features = await Promise.all(tasks.map(async (task) => {
      const sourceRecord = await loadSourceRecord(task);
      return taskFeatures(task, byId.get(task.asset_id), sourceRecord);
    }));
    const results = await scoreBatch(features);
    await prisma.$transaction(tasks.map((task, index) => prisma.maintenanceTask.update({
      where: { id: task.id },
      data: { priority_score: Number(results[index]?.priority_score || 0), ai_score_data: results[index] || null },
    })));
    res.json({ scored: results.length, tasks: results });
  } catch (err) { next(err); }
});

// GET /api/tasks — list tasks (filtered by department, status)
router.get('/', auth, async (req, res, next) => {
  try {
    const { department, status, severity, page = 1, limit = 20 } = req.query;
    const where = { is_deleted: false };
    if (department) where.department = department;
    if (status) where.status = status;
    if (severity) where.severity = severity;

    // Non-admin users only see their own department
    if (req.user.role !== 'admin' && req.user.role !== 'control_office') {
      where.department = req.user.department;
    }

    const [tasks, total] = await Promise.all([
      prisma.maintenanceTask.findMany({
        where: { ...where, is_deleted: false },
        orderBy: { priority_score: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.maintenanceTask.count({ where: { ...where, is_deleted: false } }),
    ]);

    res.json({ tasks, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// GET /api/tasks/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const task = await prisma.maintenanceTask.findUnique({
      where: { id: req.params.id, is_deleted: false },
      include: { history: true, block_plan_items: { include: { block_plan: true } } },
    });

    if (!task) return res.status(404).json({ error: 'Not Found', message: 'Task not found' });
    res.json({ task });
  } catch (err) { next(err); }
});

// GET /api/tasks/:id/explain — retrieve an explainable AI breakdown
router.get('/:id/explain', auth, async (req, res, next) => {
  try {
    const task = await prisma.maintenanceTask.findFirst({ where: { id: req.params.id, is_deleted: false } });
    if (!task) return res.status(404).json({ error: 'Not Found', message: 'Task not found' });
    const asset = task.asset_id ? await prisma.asset.findUnique({ where: { id: task.asset_id } }) : null;
    const sourceRecord = await loadSourceRecord(task);
    const features = taskFeatures(task, asset, sourceRecord);
    const explanation = await explainScore(features);
    res.json({ task_id: task.id, task, features, explanation });
  } catch (err) { next(err); }
});

// PATCH /api/tasks/:id/status — update task status
router.patch('/:id/status', auth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const VALID_STATUSES = ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'];
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Bad Request', message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const existing = await prisma.maintenanceTask.findFirst({ where: { id, is_deleted: false } });
    if (!existing) return res.status(404).json({ error: 'Not Found', message: 'Task not found' });

    const [task] = await prisma.$transaction([
      prisma.maintenanceTask.update({ where: { id }, data: { status } }),
      prisma.maintenanceHistory.create({
        data: { task_id: id, action: 'status_change', old_status: existing.status, new_status: status, notes, performed_by: req.user.id },
      }),
    ]);

    const io = req.app.get('io');
    if (io) io.emit('task-status-updated', { task_id: id, old_status: existing.status, new_status: status });

    res.json({ message: 'Task status updated', task });
  } catch (err) { next(err); }
});

module.exports = router;
