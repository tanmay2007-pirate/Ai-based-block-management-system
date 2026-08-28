// ============================================================
// src/services/etl.js — Normalization: source defect -> MaintenanceTask
// Called after INSERT or SOFT_DELETE in any defect table
// ============================================================
const prisma = require('../lib/prisma');

/**
 * Normalize a single TMS defect into planning.maintenance_tasks
 */
async function normalizeTmsDefect(record, db = prisma) {
  const existing = await db.maintenanceTask.findFirst({
    where: { source_system: 'tms', source_id: record.id },
  });

  if (existing) {
    return db.maintenanceTask.update({
      where: { id: existing.id },
      data: {
        severity: record.severity,
        description: record.description,
        location: record.location_km ? `${record.location_km} km` : null,
        asset_id: record.asset_id,
        is_deleted: record.is_deleted,
        updated_at: new Date(),
      },
    });
  }

  return db.maintenanceTask.create({
    data: {
      source_system: 'tms',
      source_id: record.id,
      task_type: record.defect_type,
      severity: record.severity,
      description: record.description,
      location: record.location_km ? `${record.location_km} km` : null,
      department: 'TMS',
      asset_id: record.asset_id,
    },
  });
}

/**
 * Normalize a single TDMS defect into planning.maintenance_tasks
 */
async function normalizeTdmsDefect(record, db = prisma) {
  const existing = await db.maintenanceTask.findFirst({
    where: { source_system: 'tdms', source_id: record.id },
  });

  if (existing) {
    return db.maintenanceTask.update({
      where: { id: existing.id },
      data: {
        severity: record.severity,
        description: record.description,
        asset_id: record.asset_id,
        is_deleted: record.is_deleted,
        updated_at: new Date(),
      },
    });
  }

  return db.maintenanceTask.create({
    data: {
      source_system: 'tdms',
      source_id: record.id,
      task_type: record.defect_type,
      severity: record.severity,
      description: record.description,
      location: record.depot || null,
      department: 'TDMS',
      asset_id: record.asset_id,
    },
  });
}

/**
 * Normalize a single SMMS defect into planning.maintenance_tasks
 */
async function normalizeSmmsDefect(record, db = prisma) {
  const existing = await db.maintenanceTask.findFirst({
    where: { source_system: 'smms', source_id: record.id },
  });

  if (existing) {
    return db.maintenanceTask.update({
      where: { id: existing.id },
      data: {
        severity: record.severity,
        description: record.description,
        location: record.location_km ? `${record.location_km} km` : null,
        asset_id: record.asset_id,
        is_deleted: record.is_deleted,
        updated_at: new Date(),
      },
    });
  }

  return db.maintenanceTask.create({
    data: {
      source_system: 'smms',
      source_id: record.id,
      task_type: record.defect_type,
      severity: record.severity,
      description: record.description,
      location: record.location_km ? `${record.location_km} km` : null,
      department: 'SMMS',
      asset_id: record.asset_id,
    },
  });
}

module.exports = { normalizeTmsDefect, normalizeTdmsDefect, normalizeSmmsDefect };
