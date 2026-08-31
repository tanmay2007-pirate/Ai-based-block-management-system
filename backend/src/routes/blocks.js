// src/routes/blocks.js — Block plan CRUD + conflict detection skeleton
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { validate, blockPlanSchema, idParamSchema } = require('../middleware/validate');

const router = express.Router();

function normalizeStatus(plan) {
  const status = String(plan.status || '').toLowerCase();
  const labels = { pending: 'PROPOSED', proposed: 'PROPOSED', approved: 'APPROVED', rejected: 'REJECTED' };
  return { ...plan, status: labels[status] || plan.status };
}

async function transitionPlan(id, requestedStatus, user) {
  const status = String(requestedStatus).toUpperCase();
  if (!['APPROVED', 'REJECTED'].includes(status)) {
    const error = new Error('status must be APPROVED or REJECTED');
    error.status = 400;
    throw error;
  }

  const plan = await prisma.blockPlan.findUnique({ where: { id } });
  if (!plan) {
    const error = new Error('Block plan not found');
    error.status = 404;
    throw error;
  }

  const now = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const changed = await tx.blockPlan.update({
      where: { id },
      data: {
        status: status.toLowerCase(),
        approved_by: status === 'APPROVED' ? user.id : null,
        approved_at: status === 'APPROVED' ? now : null,
      },
      include: { trains: { include: { task: true } }, conflicts: true },
    });
    await tx.auditLog.create({
      data: {
        action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
        table_name: 'planning.block_plans',
        record_id: id,
        old_data: plan,
        new_data: changed,
        performed_by: user.id,
        user_id: user.id,
      },
    });
    if (status === 'APPROVED') {
      await tx.approvedBlockPlan.upsert({
        where: { block_plan_id: id },
        update: { approved_by: user.id, approved_at: now },
        create: {
          block_plan_id: id,
          section: plan.section,
          from_km: plan.from_km,
          to_km: plan.to_km,
          planned_start: plan.planned_start,
          planned_end: plan.planned_end,
          approved_by: user.id,
        },
      });
    } else {
      await tx.approvedBlockPlan.deleteMany({ where: { block_plan_id: id } });
    }
    return changed;
  });
  return updated;
}

// GET /api/blocks — list all block plans
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, section, week_start } = req.query;
    const where = {};
    if (status) {
      const storedStatus = { PROPOSED: 'pending', PENDING: 'pending', APPROVED: 'approved', REJECTED: 'rejected' }[String(status).toUpperCase()];
      where.status = storedStatus || status;
    }
    if (section) {where.section = section;}
    if (week_start) {where.week_start = { gte: new Date(week_start) };}

    const plans = await prisma.blockPlan.findMany({
      where,
      include: { trains: { include: { task: true } }, conflicts: true },
      orderBy: { planned_start: 'asc' },
    });
    res.json({ plans: plans.map(normalizeStatus) });
  } catch (err) { next(err); }
});

// GET /api/blocks/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const plan = await prisma.blockPlan.findUnique({
      where: { id: req.params.id },
      include: { trains: { include: { task: true } }, conflicts: true, block_demand: true },
    });
    if (!plan) {return res.status(404).json({ error: 'Not Found', message: 'Block plan not found' });}
    res.json({ plan: normalizeStatus(plan) });
  } catch (err) { next(err); }
});

// POST /api/blocks — create block plan (control_office/admin only)
router.post('/', auth, roleCheck(['control_office', 'admin']), validate(blockPlanSchema), async (req, res, next) => {
  try {
    const { section, from_km, to_km, planned_start, planned_end, week_start, week_end, block_demand_id } = req.validated.body;
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
router.patch('/:id/approve', auth, roleCheck(['control_office', 'admin']), validate(idParamSchema), async (req, res, next) => {
  try {
    const updated = await transitionPlan(req.validated.params.id, 'APPROVED', req.user);
    const io = req.app.get('io');
    if (io) {io.emit('block-approved', normalizeStatus(updated));}
    res.json({ message: 'Block plan approved', plan: normalizeStatus(updated) });
  } catch (err) { next(err); }
});

// PATCH /api/blocks/:id — approve or reject a proposed block plan
router.patch('/:id', auth, roleCheck(['control_office', 'admin']), validate(idParamSchema), async (req, res, next) => {
  try {
    const updated = await transitionPlan(req.validated.params.id, req.body.status, req.user);
    const publicPlan = normalizeStatus(updated);
    const io = req.app.get('io');
    if (io) {io.emit(publicPlan.status === 'APPROVED' ? 'block-approved' : 'block-rejected', publicPlan);}
    res.json({ message: `Block plan ${publicPlan.status.toLowerCase()}`, plan: publicPlan });
  } catch (err) { next(err); }
});

module.exports = router;
