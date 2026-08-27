// src/routes/tasks.js — Maintenance task listing & status updates
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

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
        where,
        orderBy: { priority_score: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.maintenanceTask.count({ where }),
    ]);

    res.json({ tasks, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
});

// GET /api/tasks/:id
router.get('/:id', auth, async (req, res, next) => {
  try {
    const task = await prisma.maintenanceTask.findUnique({
      where: { id: req.params.id },
      include: { history: true, block_plan_items: { include: { block_plan: true } } },
    });
    if (!task) return res.status(404).json({ error: 'Not Found', message: 'Task not found' });
    res.json({ task });
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

    const existing = await prisma.maintenanceTask.findUnique({ where: { id } });
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
