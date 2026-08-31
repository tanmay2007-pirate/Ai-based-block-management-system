// src/routes/schedule.js — Scheduled jobs & block demand management
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { generateSchedule } = require('../services/aiScore');
const { validate, blockDemandSchema, scheduleGenerateSchema } = require('../middleware/validate');

const router = express.Router();

function schedulePayload(tasks, assets, horizon, proposedChanges) {
  const byId = new Map(assets.map((asset) => [String(asset.id).trim().toLowerCase(), asset]));
  const assetForTask = (task) => {
    if (!task.asset_id) {return null;}
    return byId.get(String(task.asset_id).trim().toLowerCase()) || null;
  };

  return {
    horizon,
    proposedChanges,
    tasks: tasks.map((task) => {
      const asset = assetForTask(task);
      const section = asset?.section || 'unknown';
      return {
        task_id: task.id, corridor_id: section, corridor: section,
        department: task.department, severity: task.severity, priority_score: task.priority_score,
        estimated_duration_hours: task.estimated_hours, is_critical: task.severity === 'critical',
        asset_type: asset?.asset_type || 'track',
      };
    }),
  };
}

async function loadPendingTasks() {
  const tasks = await prisma.maintenanceTask.findMany({ where: { status: 'pending', is_deleted: false } });
  const assetIds = tasks.map((task) => task.asset_id).filter(Boolean);
  let assets = await prisma.asset.findMany({ where: { id: { in: assetIds } } });
  // Keep the mapping usable when imported identifiers differ only by casing/whitespace.
  if (assets.length < new Set(assetIds.map((id) => String(id).trim().toLowerCase())).size) {
    assets = await prisma.asset.findMany();
  }
  return { tasks, assets };
}

async function persistSchedule(result, horizon, io) {
  const persisted = await prisma.$transaction(result.blocks.map((block) => {
    const taskIds = Array.isArray(block.task_ids) ? block.task_ids : [block.task_ids];
    return prisma.blockPlan.create({
      data: {
        section: block.corridor, from_km: 0, to_km: 0,
        planned_start: new Date(block.start_time), planned_end: new Date(block.end_time),
        week_start: new Date(), week_end: new Date(Date.now() + (horizon === 'month' ? 30 : 7) * 86400000),
        status: 'pending', conflict_flags: { source: 'python-ai', metrics: result.metrics },
        trains: { create: taskIds.filter(Boolean).map((taskId) => ({ task_id: taskId })) },
      },
    });
  }));
  if (io) {persisted.forEach(plan => io.emit('block-created', plan));}
  return persisted;
}

// POST /api/schedule/generate — ask Python for a plan, then persist it in PostgreSQL
router.post('/generate', auth, roleCheck(['control_office', 'admin']), validate(scheduleGenerateSchema), async (req, res, next) => {
  try {
    const { horizon, proposedChanges } = req.validated.body;
    const { tasks, assets } = await loadPendingTasks();
    const result = await generateSchedule(schedulePayload(tasks, assets, horizon || 'week', proposedChanges));
    const persisted = await persistSchedule(result, horizon || 'week', req.app.get('io'));
    res.json({ ...result, persisted_block_plan_ids: persisted.map((plan) => plan.id) });
  } catch (err) { next(err); }
});

// POST /api/schedule/commit-proposed — commit the exact simulated pinned plan
router.post('/commit-proposed', auth, roleCheck(['control_office', 'admin']), validate(scheduleGenerateSchema), async (req, res, next) => {
  try {
    const { horizon, proposedChanges } = req.validated.body;
    const { tasks, assets } = await loadPendingTasks();
    const result = await generateSchedule(schedulePayload(tasks, assets, horizon || 'week', proposedChanges));
    const persisted = await persistSchedule(result, horizon || 'week', req.app.get('io'));
    res.status(201).json({ ...result, committed: true, persisted_block_plan_ids: persisted.map((plan) => plan.id) });
  } catch (err) { next(err); }
});

// POST /api/schedule/simulate — dry-run scheduling without database writes
router.post('/simulate', auth, validate(scheduleGenerateSchema), async (req, res, next) => {
  try {
    const { horizon, proposedChanges } = req.validated.body;
    const { tasks, assets } = await loadPendingTasks();
    const result = await generateSchedule(schedulePayload(tasks, assets, horizon || 'week', proposedChanges));
    res.json({ dry_run: true, ...result });
  } catch (err) { next(err); }
});

// GET /api/schedule/demands — list block demands
router.get('/demands', auth, async (req, res, next) => {
  try {
    const demands = await prisma.blockDemand.findMany({ orderBy: { demanded_for: 'asc' } });
    res.json({ demands });
  } catch (err) { next(err); }
});

// POST /api/schedule/demands — raise block demand
router.post('/demands', auth, validate(blockDemandSchema), async (req, res, next) => {
  try {
    const { section, from_km, to_km, demanded_for, duration_hours, reason } = req.validated.body;
    const demand = await prisma.blockDemand.create({
      data: { section, from_km: from_km || 0, to_km: to_km || 0, demanded_by: req.user.department,
               demanded_for: new Date(demanded_for), duration_hours: parseFloat(duration_hours), reason },
    });
    const io = req.app.get('io');
    if (io) {io.emit('block-demand-created', demand);}
    res.status(201).json({ demand });
  } catch (err) { next(err); }
});

// GET /api/schedule/jobs — list scheduled cron jobs
router.get('/jobs', auth, roleCheck('admin'), async (req, res, next) => {
  try {
    const jobs = await prisma.scheduledTask.findMany({ orderBy: { name: 'asc' } });
    res.json({ jobs });
  } catch (err) { next(err); }
});

module.exports = router;
