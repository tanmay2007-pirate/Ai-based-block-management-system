// src/routes/etl.js — Manual ETL trigger (admin)
const express = require('express');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { normalizeTmsDefect, normalizeTdmsDefect, normalizeSmmsDefect } = require('../services/etl');
const prisma = require('../lib/prisma');

const router = express.Router();

// POST /api/etl/run — trigger full ETL normalization for all active records
router.post('/run', auth, roleCheck('admin'), async (req, res, next) => {
  try {
    const [tmsRecords, tdmsRecords, smmsRecords] = await Promise.all([
      prisma.trackMaintenance.findMany({ where: { is_deleted: false } }),
      prisma.tractionMaintenance.findMany({ where: { is_deleted: false } }),
      prisma.signallingMaintenance.findMany({ where: { is_deleted: false } }),
    ]);

    const results = await Promise.allSettled([
      ...tmsRecords.map(normalizeTmsDefect),
      ...tdmsRecords.map(normalizeTdmsDefect),
      ...smmsRecords.map(normalizeSmmsDefect),
    ]);

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    res.json({ message: 'ETL run complete', succeeded, failed, total: results.length });
  } catch (err) { next(err); }
});

module.exports = router;
