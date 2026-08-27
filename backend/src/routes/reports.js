// src/routes/reports.js — Analytics & reporting endpoints (skeleton)
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/reports/summary — high-level dashboard numbers
router.get('/summary', auth, async (req, res, next) => {
  try {
    const [totalTasks, pendingTasks, approvedPlans, criticalTasks] = await Promise.all([
      prisma.maintenanceTask.count({ where: { is_deleted: false } }),
      prisma.maintenanceTask.count({ where: { status: 'pending', is_deleted: false } }),
      prisma.approvedBlockPlan.count(),
      prisma.maintenanceTask.count({ where: { severity: 'critical', is_deleted: false } }),
    ]);
    res.json({ totalTasks, pendingTasks, approvedPlans, criticalTasks });
  } catch (err) { next(err); }
});

// GET /api/reports/audit — audit log (admin only)
router.get('/audit', auth, async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { table_name, action, limit = 50 } = req.query;
    const where = {};
    if (table_name) where.table_name = table_name;
    if (action) where.action = action;
    const logs = await prisma.auditLog.findMany({ where, orderBy: { created_at: 'desc' }, take: parseInt(limit) });
    res.json({ logs });
  } catch (err) { next(err); }
});

module.exports = router;
