// src/routes/etl.js — Manual ETL trigger (admin)
const express = require('express');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { runEtlLoader } = require('../services/etlRunner');

const router = express.Router();

// POST /api/etl/run — trigger full ETL load and normalization
router.post('/run', auth, roleCheck('admin'), async (req, res, next) => {
  try {
    const stats = await runEtlLoader();
    res.json({ message: 'ETL run complete', ...stats });
  } catch (err) { next(err); }
});

module.exports = router;
