// ============================================================
// src/routes/defects.js — Add/Soft-Delete endpoints for TMS, TDMS, SMMS
// Includes: auth, roleCheck, ETL, AI scoring, audit log, Socket.IO events
// ============================================================
const express = require('express');
const multer = require('multer');
const ExcelJS = require('exceljs');
const prisma = require('../lib/prisma');
const auth = require('../middleware/auth');
const { roleCheck } = require('../middleware/roleCheck');
const { normalizeTmsDefect, normalizeTdmsDefect, normalizeSmmsDefect } = require('../services/etl');
const { scoreDefect, scoreBatch } = require('../services/aiScore');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { files: 1, fileSize: 10 * 1024 * 1024 } });

const BULK_CONFIG = {
  tms: {
    department: 'TMS',
    role: 'engineering',
    table: 'tms.track_maintenance',
    headers: ['asset_id', 'asset_type', 'location_km', 'defect_type', 'severity', 'description', 'reported_by'],
    model: 'trackMaintenance',
    normalize: normalizeTmsDefect,
  },
  tdms: {
    department: 'TDMS',
    role: 'traction',
    table: 'tdms.traction_maintenance',
    headers: ['asset_id', 'loco_number', 'loco_type', 'defect_type', 'severity', 'description', 'depot', 'reported_by'],
    model: 'tractionMaintenance',
    normalize: normalizeTdmsDefect,
  },
  smms: {
    department: 'SMMS',
    role: 'signal',
    table: 'smms.signalling_maintenance',
    headers: ['asset_id', 'signal_id', 'signal_type', 'location_km', 'defect_type', 'severity', 'description', 'reported_by'],
    model: 'signallingMaintenance',
    normalize: normalizeSmmsDefect,
  },
};

function getBulkConfig(department) {
  const config = BULK_CONFIG[department];
  if (!config) {
    const error = new Error('Department must be tms, tdms, or smms');
    error.status = 404;
    throw error;
  }
  return config;
}

function validateBulkRows(rows, headers, assets, actualHeaders = (rows.length ? Object.keys(rows[0]) : [])) {
  const expected = new Set(headers);
  const actual = actualHeaders;
  const missing = headers.filter((header) => !actual.includes(header));
  const extra = actual.filter((header) => !expected.has(header));
  const failures = [];
  if (missing.length || extra.length) {
    return { failures: [{ row: 1, reasons: [`Missing columns: ${missing.join(', ') || 'none'}`, `Extra columns: ${extra.join(', ') || 'none'}`] }] };
  }

  const assetIds = new Set(assets.map((asset) => asset.id));
  rows.forEach((row, index) => {
    const reasons = [];
    headers.forEach((header) => {
      if (header !== 'description' && (row[header] === undefined || row[header] === '')) reasons.push(`${header} is required`);
    });
    if (row.location_km !== undefined && row.location_km !== '' && !Number.isFinite(Number(row.location_km))) {
      reasons.push('location_km must be a number');
    }
    if (row.asset_id && !assetIds.has(String(row.asset_id).trim())) reasons.push('asset_id does not exist in core.assets');
    if (reasons.length) failures.push({ row: index + 2, reasons });
  });
  return { failures };
}

function normalizeBulkRow(row, department, userId) {
  const data = { ...row, created_by: userId };
  if (data.location_km !== undefined && data.location_km !== '') data.location_km = Number(data.location_km);
  if (department === 'tms') return data;
  if (department === 'tdms') return data;
  return data;
}

function bulkScoreInput(task) {
  return {
    task_id: task.id,
    source_system: task.source_system,
    severity: task.severity,
    task_type: task.task_type,
    department: task.department,
    description: task.description,
    asset_type: task.asset_type || (task.department === 'TMS' ? 'track' : 'signal'),
    criticality: task.criticality || 'critical',
    asset_criticality: task.criticality || 'critical',
    days_overdue: task.days_overdue || 0,
    corridor_traffic: 0,
    asset_age_years: 0,
    total_past_defects: 0,
  };
}

function isXlsxZip(buffer) {
  return buffer && buffer.length >= 4
    && buffer[0] === 0x50 && buffer[1] === 0x4b
    && buffer[2] === 0x03 && buffer[3] === 0x04;
}

function cellValue(value) {
  if (value === null || value === undefined) return '';
  if (value instanceof Date || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (value.richText) return value.richText.map(item => item.text).join('');
  if (value.result !== undefined) return value.result;
  return String(value);
}

async function readWorkbookRows(buffer) {
  if (!isXlsxZip(buffer)) {
    const error = new Error('The uploaded file is not a valid .xlsx workbook');
    error.status = 400;
    throw error;
  }

  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch (error) {
    const invalidWorkbook = new Error(`Unable to read the uploaded .xlsx workbook: ${error.message}`);
    invalidWorkbook.status = 400;
    throw invalidWorkbook;
  }
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const columnCount = worksheet.columnCount;
  const headerRow = worksheet.getRow(1);
  const headers = Array.from({ length: columnCount }, (_, index) => cellValue(headerRow.getCell(index + 1).value));
  const rows = [];
  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values = Array.from({ length: columnCount }, (_, index) => cellValue(row.getCell(index + 1).value));
    if (values.every(value => value === '')) continue;
    rows.push(Object.fromEntries(headers.map((header, index) => [header, values[index]])));
  }
  rows.headers = headers;
  return rows;
}

async function sendTemplate(res, headers, asset) {
  const example = Object.fromEntries(headers.map((header) => [header,
    header === 'asset_id' ? asset?.id || 'existing-asset-id'
      : header === 'asset_type' ? 'track'
        : header === 'location_km' ? 42.5
          : header === 'severity' ? 'medium'
            : `example-${header}`,
  ]));
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Defects');
  worksheet.addRow(headers);
  worksheet.addRow(headers.map(header => example[header]));
  const buffer = await workbook.xlsx.writeBuffer();
  res.setHeader('Content-Disposition', 'attachment; filename="defect-template.xlsx"');
  res.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet').send(buffer);
}

async function handleBulkUpload(req, res, next, department) {
  try {
    const config = getBulkConfig(department);
    if (!req.file || !req.file.originalname.toLowerCase().endsWith('.xlsx')) {
      return res.status(400).json({ error: 'Bad Request', message: 'An .xlsx file is required in the file field' });
    }

    const rows = await readWorkbookRows(req.file.buffer);
    if (!rows.length) return res.status(400).json({ error: 'Bad Request', message: 'The workbook must contain a header row and at least one data row' });

    const assets = await prisma.asset.findMany({ select: { id: true } });
    const validation = validateBulkRows(rows, config.headers, assets, rows.headers);
    if (validation.failures.length) {
      return res.status(400).json({ error: 'Validation failed', missing_or_extra_columns: validation.failures[0].row === 1 ? validation.failures[0].reasons : [], failed_rows: validation.failures });
    }

    const { tasks, records } = await prisma.$transaction(async (tx) => {
      const insertedRecords = [];
      const normalizedTasks = [];
      for (const row of rows) {
        const record = await tx[config.model].create({ data: normalizeBulkRow(row, department, req.user.id) });
        insertedRecords.push(record);
        await tx.auditLog.create({
          data: {
            action: 'INSERT',
            table_name: config.table,
            record_id: record.id,
            new_data: record,
            performed_by: req.user.id,
            user_id: req.user.id,
          },
        });
        normalizedTasks.push(await config.normalize(record, tx));
      }
      return { records: insertedRecords, tasks: normalizedTasks };
    });

    let scores;
    try {
      scores = await scoreBatch(tasks.map(bulkScoreInput));
    } catch (error) {
      console.error(`[AI] Failed to batch-score ${tasks.length} uploaded tasks:`, error.message);
      scores = [];
    }
    const scoredTasks = await prisma.$transaction(tasks.map((task, index) => {
      const score = scores[index];
      return score?.priority_score === undefined
        ? prisma.maintenanceTask.findUnique({ where: { id: task.id } })
        : prisma.maintenanceTask.update({
          where: { id: task.id },
          data: { priority_score: score.priority_score, ai_score_data: score },
        });
    }));

    const summary = { department: config.department, records: records.length, scored: scores.length };
    const io = req.app.get('io');
    if (io) io.emit('bulk-tasks-added', { count: records.length, summary, tasks: scoredTasks });
    res.status(201).json({ message: `${config.department} defects uploaded`, ...summary, failed_rows: [], tasks: scoredTasks });
  } catch (error) {
    next(error);
  }
}

for (const department of Object.keys(BULK_CONFIG)) {
  const config = BULK_CONFIG[department];
  router.get(`/${department}/defects/template`, auth, roleCheck([config.role, 'admin']), async (req, res, next) => {
    try {
      const asset = await prisma.asset.findFirst({ select: { id: true } });
      await sendTemplate(res, config.headers, asset);
    } catch (error) {
      next(error);
    }
  });
  router.post(`/${department}/defects/bulk-upload`, auth, roleCheck([config.role, 'admin']), upload.single('file'),
    (req, res, next) => handleBulkUpload(req, res, next, department));
}

const DEPARTMENT_BY_SOURCE = { tms: 'TMS', tdms: 'TDMS', smms: 'SMMS' };

function assertDepartmentOwnership(req, source) {
  const department = DEPARTMENT_BY_SOURCE[source];
  if (req.user.role !== 'admin' && req.user.department !== department) {
    const error = new Error(`Only ${department} members can modify this defect`);
    error.status = 403;
    throw error;
  }
}

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

async function applyAiScore(task) {
  try {
    const asset = task.asset_id ? await prisma.asset.findUnique({ where: { id: task.asset_id } }) : null;
    const source = task.source_system === 'tms'
      ? await prisma.trackMaintenance.findUnique({ where: { id: task.source_id } })
      : task.source_system === 'tdms'
        ? await prisma.tractionMaintenance.findUnique({ where: { id: task.source_id } })
        : task.source_system === 'smms'
          ? await prisma.signallingMaintenance.findUnique({ where: { id: task.source_id } })
          : null;
    const assetAgeYears = asset?.installation_date
      ? Math.max(0, (Date.now() - new Date(asset.installation_date).getTime()) / (365.25 * 86400000))
      : 0;
    const scoreResult = await scoreDefect({
      ...task,
      asset_type: source?.asset_type || asset?.asset_type,
      criticality: source?.criticality || asset?.criticality,
      asset_criticality: source?.criticality || asset?.criticality,
      days_overdue: source?.overdue_days || 0,
      traffic_level: asset?.traffic_level || 0,
      asset_age_years: assetAgeYears,
      total_past_defects: asset?.total_past_defects || 0,
    });
    if (scoreResult?.priority_score === undefined) return task;

    const scoredTask = await prisma.maintenanceTask.update({
      where: { id: task.id },
      data: { priority_score: scoreResult.priority_score, ai_score_data: scoreResult },
    });
    return scoredTask;
  } catch (error) {
    console.error(`[AI] Failed to score task ${task.id}:`, error.message);
    return task;
  }
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
    const scoredTask = await applyAiScore(task);

    // Emit Socket.IO event
    const io = req.app.get('io');
    if (io) io.emit('task-added', { task: scoredTask, source: 'tms' });

    res.status(201).json({ message: 'TMS defect added', record, task: scoredTask });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tms/defects/:id — soft delete, engineering only
router.delete('/tms/defects/:id', auth, roleCheck(['engineering', 'admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    assertDepartmentOwnership(req, 'tms');

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
    const task = await prisma.maintenanceTask.findFirst({
      where: { source_system: 'tms', source_id: id, is_deleted: false },
    });
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
    const { asset_id, loco_number, loco_type, defect_type, severity, description, depot, reported_by } = req.body;

    if (!loco_number || !loco_type || !defect_type || !severity) {
      return res.status(400).json({ error: 'Bad Request', message: 'loco_number, loco_type, defect_type, severity are required' });
    }

    const record = await prisma.tractionMaintenance.create({
      data: { asset_id, loco_number, loco_type, defect_type, severity, description, depot, reported_by, created_by: req.user.id },
    });

    await writeAuditLog({ action: 'INSERT', table_name: 'tdms.traction_maintenance', record_id: record.id, new_data: record, user: req.user });

    const task = await normalizeTdmsDefect(record);

    const scoredTask = await applyAiScore(task);

    const io = req.app.get('io');
    if (io) io.emit('task-added', { task: scoredTask, source: 'tdms' });

    res.status(201).json({ message: 'TDMS defect added', record, task: scoredTask });
  } catch (err) {
    next(err);
  }
});

router.delete('/tdms/defects/:id', auth, roleCheck(['traction', 'admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    assertDepartmentOwnership(req, 'tdms');

    const existing = await prisma.tractionMaintenance.findUnique({ where: { id } });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Defect not found or already deleted' });
    }

    const deleted = await prisma.tractionMaintenance.update({
      where: { id },
      data: { is_deleted: true, deleted_at: new Date(), deleted_by: req.user.id },
    });

    await writeAuditLog({ action: 'SOFT_DELETE', table_name: 'tdms.traction_maintenance', record_id: id, old_data: existing, user: req.user });

    const task = await prisma.maintenanceTask.findFirst({
      where: { source_system: 'tdms', source_id: id, is_deleted: false },
    });
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
    const { asset_id, signal_id, signal_type, location_km, defect_type, severity, description, reported_by } = req.body;

    if (!signal_id || !signal_type || !defect_type || !severity) {
      return res.status(400).json({ error: 'Bad Request', message: 'signal_id, signal_type, defect_type, severity are required' });
    }

    const record = await prisma.signallingMaintenance.create({
      data: { asset_id, signal_id, signal_type, location_km, defect_type, severity, description, reported_by, created_by: req.user.id },
    });

    await writeAuditLog({ action: 'INSERT', table_name: 'smms.signalling_maintenance', record_id: record.id, new_data: record, user: req.user });

    const task = await normalizeSmmsDefect(record);

    const scoredTask = await applyAiScore(task);

    const io = req.app.get('io');
    if (io) io.emit('task-added', { task: scoredTask, source: 'smms' });

    res.status(201).json({ message: 'SMMS defect added', record, task: scoredTask });
  } catch (err) {
    next(err);
  }
});

router.delete('/smms/defects/:id', auth, roleCheck(['signal', 'admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    assertDepartmentOwnership(req, 'smms');

    const existing = await prisma.signallingMaintenance.findUnique({ where: { id } });
    if (!existing || existing.is_deleted) {
      return res.status(404).json({ error: 'Not Found', message: 'Defect not found or already deleted' });
    }

    const deleted = await prisma.signallingMaintenance.update({
      where: { id },
      data: { is_deleted: true, deleted_at: new Date(), deleted_by: req.user.id },
    });

    await writeAuditLog({ action: 'SOFT_DELETE', table_name: 'smms.signalling_maintenance', record_id: id, old_data: existing, user: req.user });

    const task = await prisma.maintenanceTask.findFirst({
      where: { source_system: 'smms', source_id: id, is_deleted: false },
    });
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
