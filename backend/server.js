// ============================================================
// server.js — AI Railway Block Management System
// Express + Socket.IO entry point
// ============================================================
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cron = require('node-cron');

// Route files
const authRoutes      = require('./src/routes/auth');
const defectRoutes    = require('./src/routes/defects');
const blockRoutes     = require('./src/routes/blocks');
const taskRoutes      = require('./src/routes/tasks');
const scheduleRoutes  = require('./src/routes/schedule');
const reportRoutes    = require('./src/routes/reports');
const etlRoutes       = require('./src/routes/etl');
const emergencyRoutes = require('./src/routes/emergency');

// Middleware
const errorHandler = require('./src/middleware/errorHandler');

const prisma = require('./src/lib/prisma');

// ============================================================
// App & server setup
// ============================================================
const app = express();
const server = http.createServer(app);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PORT = process.env.PORT || 5000;

// ============================================================
// CORS — MUST be before all routes
// ============================================================
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ============================================================
// Socket.IO
// ============================================================
const io = new Server(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:3000', 'http://localhost:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible inside route handlers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });

  // Client can join department-specific rooms
  socket.on('join-department', (department) => {
    socket.join(department);
    console.log(`[Socket.IO] ${socket.id} joined room: ${department}`);
  });
});

// ============================================================
// Body parsing
// ============================================================
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// Health check (no auth required)
// ============================================================
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      version: '1.0.0',
      service: 'AI Railway Block Management — Backend',
    });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: err.message });
  }
});

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth',      authRoutes);
app.use('/api',           defectRoutes);   // /api/tms/defects, /api/tdms/defects, /api/smms/defects
app.use('/api/blocks',    blockRoutes);
app.use('/api/tasks',     taskRoutes);
app.use('/api/schedule',  scheduleRoutes);
app.use('/api/reports',   reportRoutes);
app.use('/api/etl',       etlRoutes);
app.use('/api/emergency', emergencyRoutes);

// 404 catch-all for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.path} does not exist` });
});

// ============================================================
// Global error handler — MUST be last middleware
// ============================================================
app.use(errorHandler);

// ============================================================
// Scheduled Jobs (node-cron)
// ============================================================

// Nightly ETL run at 02:00 every day
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Nightly ETL normalization started');
  try {
    const { normalizeTmsDefect, normalizeTdmsDefect, normalizeSmmsDefect } = require('./src/services/etl');
    const [tms, tdms, smms] = await Promise.all([
      prisma.trackMaintenance.findMany({ where: { is_deleted: false } }),
      prisma.tractionMaintenance.findMany({ where: { is_deleted: false } }),
      prisma.signallingMaintenance.findMany({ where: { is_deleted: false } }),
    ]);
    await Promise.allSettled([
      ...tms.map(normalizeTmsDefect),
      ...tdms.map(normalizeTdmsDefect),
      ...smms.map(normalizeSmmsDefect),
    ]);
    console.log(`[CRON] ETL done — processed TMS:${tms.length} TDMS:${tdms.length} SMMS:${smms.length}`);
    await prisma.scheduledTask.upsert({
      where: { name: 'nightly-etl' },
      update: { last_run_at: new Date(), status: 'active' },
      create: { name: 'nightly-etl', cron_expression: '0 2 * * *', last_run_at: new Date() },
    });
  } catch (err) {
    console.error('[CRON] ETL error:', err.message);
  }
}, { timezone: 'Asia/Kolkata' });

// ============================================================
// Start server
// ============================================================
server.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  AI Railway Block Management — Backend          ║`);
  console.log(`║  Server running on http://localhost:${PORT}        ║`);
  console.log(`║  Frontend allowed from: ${FRONTEND_URL}  ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('[SERVER] SIGTERM received — shutting down gracefully');
  await prisma.$disconnect();
  server.close(() => process.exit(0));
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
