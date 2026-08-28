// src/routes/reports.js — Analytics & reporting endpoints (skeleton)
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// Availability is (horizon hours - block hours) / horizon hours; utilization is work time / block time.
router.get('/summary', auth, async (req, res, next) => {
  try {
    const [totalTasks, pendingTasks, approvedPlans, criticalTasks, plans, tasks] = await Promise.all([
      prisma.maintenanceTask.count({ where: { is_deleted: false } }),
      prisma.maintenanceTask.count({ where: { status: 'pending', is_deleted: false } }),
      prisma.approvedBlockPlan.count(),
      prisma.maintenanceTask.count({ where: { severity: 'critical', is_deleted: false } }),
      prisma.blockPlan.findMany({ select: { section: true, planned_start: true, planned_end: true, conflict_flags: true, trains: { include: { task: { select: { department: true } } } } } }),
      prisma.maintenanceTask.findMany({ where: { is_deleted: false }, select: { department: true, status: true, created_at: true } }),
    ]);
    const availabilityByCorridor = {};
    for (const plan of plans) {
      const hours = Math.max(0, (plan.planned_end - plan.planned_start) / 3600000);
      availabilityByCorridor[plan.section] = (availabilityByCorridor[plan.section] || 168) - hours;
    }
    Object.keys(availabilityByCorridor).forEach((key) => {
      availabilityByCorridor[key] = Number(Math.max(0, availabilityByCorridor[key] / 168 * 100).toFixed(2));
    });
    const departments = [...new Set(tasks.map((task) => task.department))];
    const utilizationByDepartment = {};
    for (const plan of plans) {
      const duration = Math.max(0, (plan.planned_end - plan.planned_start) / 3600000);
      for (const item of plan.trains) {
        const department = item.task?.department;
        if (department) utilizationByDepartment[department] = (utilizationByDepartment[department] || 0) + duration;
      }
    }
    Object.keys(utilizationByDepartment).forEach(key => { utilizationByDepartment[key] = Number(Math.min(100, utilizationByDepartment[key] / 168 * 100).toFixed(2)); });
    const completionByDepartment = Object.fromEntries(departments.map((department) => {
      const due = tasks.filter((task) => task.department === department);
      return [department, due.length ? Number((due.filter((task) => task.status === 'completed').length / due.length * 100).toFixed(2)) : 0];
    }));
    const availability30Days = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(); date.setHours(0, 0, 0, 0); date.setDate(date.getDate() - (29 - index));
      const end = new Date(date); end.setDate(end.getDate() + 1);
      const downtime = plans.filter((plan) => plan.planned_start < end && plan.planned_end > date)
        .reduce((sum, plan) => sum + Math.max(0, (Math.min(plan.planned_end, end) - Math.max(plan.planned_start, date)) / 3600000), 0);
      return { date: date.toISOString().slice(0, 10), availability_percentage: Number(Math.max(0, (24 - downtime) / 24 * 100).toFixed(2)) };
    });
    res.json({ totalTasks, pendingTasks, approvedPlans, criticalTasks, availability: { network_average: availability30Days.reduce((sum, item) => sum + item.availability_percentage, 0) / 30, by_corridor: availabilityByCorridor, daily: availability30Days }, completion_by_department: completionByDepartment, utilization_by_department: utilizationByDepartment });
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
