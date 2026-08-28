// src/routes/blocks.js — Block plan CRUD + conflict detection skeleton
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/blocks — list all block plans
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, section, week_start } = req.query;
    const where = {};
    if (status) where.status = status;
    if (section) where.section = section;
    if (week_start) where.week_start = { gte: new Date(week_start) };

    const plans = await prisma.blockPlan.findMany({
      where,
      include: { trains: { include: { task: true } }, conflicts: true },
      orderBy: { planned_start: 'asc' },
    });
    res.json({ plans });
  } catch (err) { next(err); }
});

// GET /api/blocks/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const plan = await prisma.blockPlan.findUnique({
      where: { id: req.params.id },
      include: { trains: { include: { task: true } }, conflicts: true, block_demand: true },
    });
    if (!plan) return res.status(404).json({ error: 'Not Found', message: 'Block plan not found' });
    res.json({ plan });
  } catch (err) { next(err); }
});

// POST /api/blocks — create block plan (control_office/admin only)
router.post('/', auth, roleCheck(['control_office', 'admin']), async (req, res, next) => {
  try {
    const { section, from_km, to_km, planned_start, planned_end, week_start, week_end, block_demand_id } = req.body;
    if (!section || !planned_start || !planned_end) {
      return res.status(400).json({ error: 'Bad Request', message: 'section, planned_start, planned_end required' });
    }
    const plan = await prisma.blockPlan.create({
      data: { section, from_km, to_km, planned_start: new Date(planned_start), planned_end: new Date(planned_end),
               week_start: week_start ? new Date(week_start) : new Date(planned_start),
               week_end: week_end ? new Date(week_end) : new Date(planned_end), block_demand_id },
    });
    const io = req.app.get('io');
    if (io) {
      io.emit('block-plan-created', plan);
      io.emit('block-created', plan);
    }
    res.status(201).json({ plan });
  } catch (err) { next(err); }
});

// PATCH /api/blocks/:id/approve — approve a block plan
router.patch('/:id/approve', auth, roleCheck(['control_office', 'admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const plan = await prisma.blockPlan.findUnique({ where: { id } });
    if (!plan) return res.status(404).json({ error: 'Not Found', message: 'Block plan not found' });

    const updated = await prisma.blockPlan.update({
      where: { id },
      data: { status: 'approved', approved_by: req.user.id, approved_at: new Date() },
    });

    // Mirror into approved_block_plans
    await prisma.approvedBlockPlan.upsert({
      where: { block_plan_id: id },
      update: { approved_by: req.user.id, approved_at: new Date() },
      create: {
        block_plan_id: id,
        section: plan.section,
        from_km: plan.from_km,
        to_km: plan.to_km,
        planned_start: plan.planned_start,
        planned_end: plan.planned_end,
        approved_by: req.user.id,
      },
    });

    const io = req.app.get('io');
    if (io) {
      io.emit('block-plan-approved', updated);
      io.emit('block-approved', updated);
    }
    res.json({ message: 'Block plan approved', plan: updated });
  } catch (err) { next(err); }
});

module.exports = router;
