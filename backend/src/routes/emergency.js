// src/routes/emergency.js — Emergency defect fast-track (any auth'd user)
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/emergency — raise an emergency notification
router.post('/', auth, async (req, res, next) => {
  try {
    const { title, message, related_id } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Bad Request', message: 'title and message required' });
    }
    const notification = await prisma.notification.create({
      data: { type: 'emergency', title, message, related_id },
    });
    const io = req.app.get('io');
    if (io) io.emit('emergency-alert', notification);
    res.status(201).json({ notification });
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
router.patch('/notifications/:id/read', auth, async (req, res, next) => {
  try {
    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { is_read: true },
    });
    res.json({ notification: updated });
  } catch (err) { next(err); }
});

module.exports = router;
