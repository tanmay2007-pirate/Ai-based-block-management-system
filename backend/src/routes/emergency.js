// src/routes/emergency.js — Emergency defect fast-track (any auth'd user)
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { scoreDefect, generateSchedule } = require('../services/aiScore');
const { validate, emergencyNotificationSchema, emergencyDefectSchema, idParamSchema } = require('../middleware/validate');

const router = express.Router();

// POST /api/emergency — raise an emergency notification
router.post('/', auth, validate(emergencyNotificationSchema), async (req, res, next) => {
  try {
    const { title, message, related_id } = req.validated.body;
    const notification = await prisma.notification.create({
      data: { type: 'emergency', title, message, related_id },
    });

    const io = req.app.get('io');
    if (io) {io.emit('emergency-alert', notification);}
    res.status(201).json({ notification });
  } catch (err) { next(err); }
});

// POST /api/emergency/defect — save, score, and re-plan a critical defect
router.post('/defect', auth, validate(emergencyDefectSchema), async (req, res, next) => {
  try {
    const { asset_id, section, severity = 'critical', description, department = req.user.department,
      days_overdue = 0, traffic_level = 0, asset_type = 'track', criticality = 'critical' } = req.validated.body;
    const task = await prisma.maintenanceTask.create({
      data: {
        source_system: 'emergency', source_id: `emergency-${Date.now()}`, task_type: 'emergency_defect',
        severity, description, department, asset_id, status: 'pending',
      },
    });
    const score = await scoreDefect({ ...task, criticality, days_overdue, traffic_level, asset_type });
    const priorityScore = Number(score.priority_score) || 0;
    let replan = null;
    if (priorityScore >= 70) {
      const before = await prisma.blockPlan.findMany({
        where: { section, planned_end: { gte: new Date() } },
        include: { trains: true },
        orderBy: { planned_start: 'asc' },
      });
      replan = await generateSchedule({
        horizon: 'week',
        tasks: [{ task_id: task.id, corridor_id: section, corridor: section, section,
          department, severity, priority_score: priorityScore, is_critical: true,
          estimated_duration_hours: 2, days_overdue, asset_type }],
      });
      if (req.app.get('io')) {req.app.get('io').emit('schedule-reoptimized',
        { section, before, after: replan, task_id: task.id });}
    }
    res.status(201).json({ task, score, replan, reoptimized: Boolean(replan) });
  } catch (err) { next(err); }
});

// GET /api/emergency/notifications
router.get('/notifications', auth, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { is_read: false },
      orderBy: { created_at: 'desc' },
    });
    res.json({ notifications });
  } catch (err) { next(err); }
});

// PATCH /api/emergency/notifications/:id/read
router.patch('/notifications/:id/read', auth, validate(idParamSchema), async (req, res, next) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.validated.params.id },
      data: { is_read: true },
    });
    res.json({ notification: updated });
  } catch (err) { next(err); }
});

module.exports = router;;
