const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { validate, idParamSchema } = require('../middleware/validate');

const router = express.Router();

router.get('/:id/timeline', auth, validate(idParamSchema), async (req, res, next) => {
  try {
    const [trains, blocks] = await Promise.all([
      prisma.trainOperations.findMany({ where: { section: req.validated.params.id }, orderBy: { departure_time: 'asc' } }),
      prisma.blockPlan.findMany({ where: { section: req.validated.params.id }, include: { trains: true }, orderBy: { planned_start: 'asc' } }),
    ]);
    const corridors = [...new Set(blocks.map(block => block.section))];
    res.json({ corridor: req.validated.params.id, corridors, trains, blocks });
  } catch (err) { next(err); }
});

module.exports = router;
