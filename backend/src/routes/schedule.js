// src/routes/schedule.js — Scheduled jobs & block demand management
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/schedule/demands — list block demands
router.get('/demands', auth, async (req, res, next) => {
  try {
    const demands = await prisma.blockDemand.findMany({ orderBy: { demanded_for: 'asc' } });
    res.json({ demands });
  } catch (err) { next(err); }
});

// POST /api/schedule/demands — raise block demand
router.post('/demands', auth, async (req, res, next) => {
  try {
    const { section, from_km, to_km, demanded_for, duration_hours, reason } = req.body;
    if (!section || !demanded_for || !duration_hours) {
      return res.status(400).json({ error: 'Bad Request', message: 'section, demanded_for, duration_hours required' });
    }
    const demand = await prisma.blockDemand.create({
      data: { section, from_km: from_km || 0, to_km: to_km || 0, demanded_by: req.user.department,
               demanded_for: new Date(demanded_for), duration_hours: parseFloat(duration_hours), reason },
    });
    const io = req.app.get('io');
    if (io) io.emit('block-demand-created', demand);
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
