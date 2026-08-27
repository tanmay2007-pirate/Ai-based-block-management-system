// ============================================================
// src/services/etl.js — Normalization: source defect -> MaintenanceTask
// Called after INSERT or SOFT_DELETE in any defect table
// ============================================================
const prisma = require('../lib/prisma');

/**
 * Normalize a single TMS defect into planning.maintenance_tasks
 */
async function normalizeTmsDefect(record) {
  const existing = await prisma.maintenanceTask.findFirst({
    where: { source_system: 'tms', source_id: record.id },
  });

  if (existing) {
    return prisma.maintenanceTask.update({
      where: { id: existing.id },
      data: {
        severity: record.severity,
        description: record.description,
        location: record.location_km ? `${record.location_km} km` : null,
        is_deleted: record.is_deleted,
        updated_at: new Date(),
      },
    });
  }

  return prisma.maintenanceTask.create({
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
async function normalizeTdmsDefect(record) {
  const existing = await prisma.maintenanceTask.findFirst({
    where: { source_system: 'tdms', source_id: record.id },
  });

  if (existing) {
    return prisma.maintenanceTask.update({
      where: { id: existing.id },
      data: {
        severity: record.severity,
        description: record.description,
        is_deleted: record.is_deleted,
        updated_at: new Date(),
      },
    });
  }

  return prisma.maintenanceTask.create({
    data: {
      source_system: 'tdms',
      source_id: record.id,
      task_type: record.defect_type,
      severity: record.severity,
      description: record.description,
      location: record.depot || null,
      department: 'TDMS',
    },
  });
}

/**
 * Normalize a single SMMS defect into planning.maintenance_tasks
 */
async function normalizeSmmsDefect(record) {
  const existing = await prisma.maintenanceTask.findFirst({
    where: { source_system: 'smms', source_id: record.id },
  });

  if (existing) {
    return prisma.maintenanceTask.update({
      where: { id: existing.id },
      data: {
        severity: record.severity,
        description: record.description,
        location: record.location_km ? `${record.location_km} km` : null,
        is_deleted: record.is_deleted,
        updated_at: new Date(),
      },
    });
  }

  return prisma.maintenanceTask.create({
    data: {
      source_system: 'smms',
      source_id: record.id,
      task_type: record.defect_type,
      severity: record.severity,
      description: record.description,
      location: record.location_km ? `${record.location_km} km` : null,
      department: 'SMMS',
    },
  });
}

module.exports = { normalizeTmsDefect, normalizeTdmsDefect, normalizeSmmsDefect };
