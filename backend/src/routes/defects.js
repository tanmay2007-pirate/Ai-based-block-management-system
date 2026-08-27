// ============================================================
// src/routes/defects.js — Add/Soft-Delete endpoints for TMS, TDMS, SMMS
// Includes: auth, roleCheck, ETL, AI scoring, audit log, Socket.IO events
// ============================================================
const express = require('express');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { normalizeTmsDefect, normalizeTdmsDefect, normalizeSmmsDefect } = require('../services/etl');
const { scoreDefect } = require('../services/aiScore');

const router = express.Router();

// Utility: write an audit log entry
async function writeAuditLog({ action, table_name, record_id, old_data, new_data, user }) {
  await prisma.auditLog.create({
    data: {
      action,
      table_name,
      record_id,
      old_data: old_data || null,
      new_data: new_data || null,
      performed_by: user.id,
      user_id: user.id,
    },
  });
}

// ============================================================
// TMS DEFECTS
// ============================================================

// POST /api/tms/defects — engineering only
router.post('/tms/defects', auth, roleCheck(['engineering', 'admin']), async (req, res, next) => {
  try {
    const { asset_id, asset_type, location_km, defect_type, severity, description, reported_by } = req.body;

    if (!asset_type || !defect_type || !severity) {
      return res.status(400).json({ error: 'Bad Request', message: 'asset_type, defect_type, severity are required' });
    }

    const record = await prisma.trackMaintenance.create({
      data: { asset_id, asset_type, location_km, defect_type, severity, description, reported_by, created_by: req.user.id },
    });

    await writeAuditLog({ action: 'INSERT', table_name: 'tms.track_maintenance', record_id: record.id, new_data: record, user: req.user });

    // ETL: normalize into planning.maintenance_tasks
    const task = await normalizeTmsDefect(record);

    // AI score (non-blocking — if AI service down, we continue)
    const scoreResult = await scoreDefect(task);
    if (scoreResult?.priority_score !== undefined) {
      await prisma.maintenanceTask.update({
        where: { id: task.id },
        data: { priority_score: scoreResult.priority_score, ai_score_data: scoreResult },
      });
      task.priority_score = scoreResult.priority_score;
    }

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) io.emit('task-added', { task, source: 'tms' });

    res.status(201).json({ message: 'TMS defect added', record, task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tms/defects/:id — soft delete, engineering only
router.delete('/tms/defects/:id', auth, roleCheck(['engineering', 'admin']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.trackMaintenance.findUnique({ where: { id } });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Defect not found or already deleted' });
    }

    // Soft delete
    const deleted = await prisma.trackMaintenance.update({
      where: { id },
      data: { is_deleted: true, deleted_at: new Date(), deleted_by: req.user.id },
    });

    await writeAuditLog({ action: 'SOFT_DELETE', table_name: 'tms.track_maintenance', record_id: id, old_data: existing, user: req.user });

    // Mirror soft-delete in planning.maintenance_tasks
    const task = await prisma.maintenanceTask.findFirst({ where: { source_system: 'tms', source_id: id } });
    if (task) {
      // Check if in an APPROVED block plan
      const inApprovedPlan = await prisma.blockPlanTrain.findFirst({
        where: { task_id: task.id, block_plan: { status: 'approved' } },
        include: { block_plan: true },
      });

      if (inApprovedPlan) {
        // Do NOT delete — flag for planner review
        await prisma.notification.create({
          data: {
            type: 'planner_review',
            title: 'Defect Deletion Pending Review',
            message: `TMS defect ${id} was soft-deleted but is part of approved block plan ${inApprovedPlan.block_plan_id}. Manual review required.`,
            related_id: inApprovedPlan.block_plan_id,
          },
        });
      } else {
        await prisma.maintenanceTask.update({ where: { id: task.id }, data: { is_deleted: true } });
      }
    }

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) io.emit('task-deleted', { task_id: task?.id, source_id: id, source: 'tms' });

    res.json({ message: 'TMS defect soft-deleted', id });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// TDMS DEFECTS
// ============================================================

router.post('/tdms/defects', auth, roleCheck(['traction', 'admin']), async (req, res, next) => {
  try {
    const { loco_number, loco_type, defect_type, severity, description, depot, reported_by } = req.body;

    if (!loco_number || !loco_type || !defect_type || !severity) {
      return res.status(400).json({ error: 'Bad Request', message: 'loco_number, loco_type, defect_type, severity are required' });
    }

    const record = await prisma.tractionMaintenance.create({
      data: { loco_number, loco_type, defect_type, severity, description, depot, reported_by, created_by: req.user.id },
    });

    await writeAuditLog({ action: 'INSERT', table_name: 'tdms.traction_maintenance', record_id: record.id, new_data: record, user: req.user });

    const task = await normalizeTdmsDefect(record);

    const scoreResult = await scoreDefect(task);
    if (scoreResult?.priority_score !== undefined) {
      await prisma.maintenanceTask.update({
        where: { id: task.id },
        data: { priority_score: scoreResult.priority_score, ai_score_data: scoreResult },
      });
      task.priority_score = scoreResult.priority_score;
    }

    const io = req.app.get('io');
    if (io) io.emit('task-added', { task, source: 'tdms' });

    res.status(201).json({ message: 'TDMS defect added', record, task });
  } catch (err) {
    next(err);
  }
});

router.delete('/tdms/defects/:id', auth, roleCheck(['traction', 'admin']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.tractionMaintenance.findUnique({ where: { id } });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Defect not found or already deleted' });
    }

    const deleted = await prisma.tractionMaintenance.update({
      where: { id },
      data: { is_deleted: true, deleted_at: new Date(), deleted_by: req.user.id },
    });

    await writeAuditLog({ action: 'SOFT_DELETE', table_name: 'tdms.traction_maintenance', record_id: id, old_data: existing, user: req.user });

    const task = await prisma.maintenanceTask.findFirst({ where: { source_system: 'tdms', source_id: id } });
    if (task) {
      const inApprovedPlan = await prisma.blockPlanTrain.findFirst({
        where: { task_id: task.id, block_plan: { status: 'approved' } },
        include: { block_plan: true },
      });

      if (inApprovedPlan) {
        await prisma.notification.create({
          data: {
            type: 'planner_review',
            title: 'Defect Deletion Pending Review',
            message: `TDMS defect ${id} was soft-deleted but is part of approved block plan ${inApprovedPlan.block_plan_id}. Manual review required.`,
            related_id: inApprovedPlan.block_plan_id,
          },
        });
      } else {
        await prisma.maintenanceTask.update({ where: { id: task.id }, data: { is_deleted: true } });
      }
    }

    const io = req.app.get('io');
    if (io) io.emit('task-deleted', { task_id: task?.id, source_id: id, source: 'tdms' });

    res.json({ message: 'TDMS defect soft-deleted', id });
  } catch (err) {
    next(err);
  }
});

// ============================================================
// SMMS DEFECTS
// ============================================================

router.post('/smms/defects', auth, roleCheck(['signal', 'admin']), async (req, res, next) => {
  try {
    const { signal_id, signal_type, location_km, defect_type, severity, description, reported_by } = req.body;

    if (!signal_id || !signal_type || !defect_type || !severity) {
      return res.status(400).json({ error: 'Bad Request', message: 'signal_id, signal_type, defect_type, severity are required' });
    }

    const record = await prisma.signallingMaintenance.create({
      data: { signal_id, signal_type, location_km, defect_type, severity, description, reported_by, created_by: req.user.id },
    });

    await writeAuditLog({ action: 'INSERT', table_name: 'smms.signalling_maintenance', record_id: record.id, new_data: record, user: req.user });

    const task = await normalizeSmmsDefect(record);

    const scoreResult = await scoreDefect(task);
    if (scoreResult?.priority_score !== undefined) {
      await prisma.maintenanceTask.update({
        where: { id: task.id },
        data: { priority_score: scoreResult.priority_score, ai_score_data: scoreResult },
      });
      task.priority_score = scoreResult.priority_score;
    }

    const io = req.app.get('io');
    if (io) io.emit('task-added', { task, source: 'smms' });

    res.status(201).json({ message: 'SMMS defect added', record, task });
  } catch (err) {
    next(err);
  }
});

router.delete('/smms/defects/:id', auth, roleCheck(['signal', 'admin']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.signallingMaintenance.findUnique({ where: { id } });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Defect not found or already deleted' });
    }

    const deleted = await prisma.signallingMaintenance.update({
      where: { id },
      data: { is_deleted: true, deleted_at: new Date(), deleted_by: req.user.id },
    });

    await writeAuditLog({ action: 'SOFT_DELETE', table_name: 'smms.signalling_maintenance', record_id: id, old_data: existing, user: req.user });

    const task = await prisma.maintenanceTask.findFirst({ where: { source_system: 'smms', source_id: id } });
    if (task) {
      const inApprovedPlan = await prisma.blockPlanTrain.findFirst({
        where: { task_id: task.id, block_plan: { status: 'approved' } },
        include: { block_plan: true },
      });

      if (inApprovedPlan) {
        await prisma.notification.create({
          data: {
            type: 'planner_review',
            title: 'Defect Deletion Pending Review',
            message: `SMMS defect ${id} was soft-deleted but is part of approved block plan ${inApprovedPlan.block_plan_id}. Manual review required.`,
            related_id: inApprovedPlan.block_plan_id,
          },
        });
      } else {
        await prisma.maintenanceTask.update({ where: { id: task.id }, data: { is_deleted: true } });
      }
    }

    const io = req.app.get('io');
    if (io) io.emit('task-deleted', { task_id: task?.id, source_id: id, source: 'smms' });

    res.json({ message: 'SMMS defect soft-deleted', id });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
