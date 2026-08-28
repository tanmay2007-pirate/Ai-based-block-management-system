// src/services/etlRunner.js — ETL runner to load JSON data into Neon database
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { normalizeTmsDefect, normalizeTdmsDefect, normalizeSmmsDefect } = require('./etl');

const DATA_DIR = path.join(__dirname, '../../data');

async function runEtlLoader() {
  console.log('[ETL] Starting data load from JSON files...');

  try {
    // 1. Read files
    const assetsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'core_assets.json'), 'utf8'));
    const tmsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tms_track_maintenance.json'), 'utf8'));
    const tdmsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'tdms_traction_maintenance.json'), 'utf8'));
    const smmsData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'smms_signalling_maintenance.json'), 'utf8'));
    const coaData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'coa_train_operations.json'), 'utf8'));
    const historyData = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'planning_maintenance_history.json'), 'utf8'));
    const assetIds = new Set(assetsData.map((item) => item.asset_id || item.id));
    const linkedRows = [...tmsData, ...tdmsData, ...smmsData, ...historyData];
    const invalidReferences = linkedRows.filter((item) => item.asset_id && !assetIds.has(item.asset_id));
    if (invalidReferences.length > 0) {
      throw new Error(`[ETL] ${invalidReferences.length} records reference an unknown asset_id`);
    }

    // 2. Clear old database tables (respect foreign key constraints)
    console.log('[ETL] Clearing existing data from tables...');
    await prisma.maintenanceHistory.deleteMany({});
    await prisma.maintenanceTask.deleteMany({});
    await prisma.trackMaintenance.deleteMany({});
    await prisma.tractionMaintenance.deleteMany({});
    await prisma.signallingMaintenance.deleteMany({});
    await prisma.trainOperations.deleteMany({});
    await prisma.asset.deleteMany({});
    console.log('[ETL] Tables cleared successfully.');

    // 3. Load core_assets.json. The seed format uses the locked asset_id/current_status
    // names; the Prisma model retains its legacy id/asset_code/name/status columns.
    console.log(`[ETL] Loading ${assetsData.length} core assets...`);
    for (const item of assetsData) {
      await prisma.asset.create({
        data: {
          id: item.asset_id || item.id,
          asset_code: item.asset_code || `${item.asset_type.slice(0, 3).toUpperCase()}-${item.zone}-${(item.asset_id || item.id).slice(0, 8)}`,
          department: item.department,
          asset_type: item.asset_type,
          name: item.name || `${item.asset_type} asset at ${item.station_location}`,
          asset_specification: item.asset_specification,
          zone: item.zone,
          division: item.division,
          section: item.section,
          station_location: item.station_location,
          location_km: item.location_km,
          gauge: item.gauge,
          manufacturer: item.manufacturer,
          installation_date: item.installation_date ? new Date(item.installation_date) : null,
          design_life_years: item.design_life_years,
          last_major_maintenance_date: item.last_major_maintenance_date ? new Date(item.last_major_maintenance_date) : null,
          last_inspection_date: item.last_inspection_date ? new Date(item.last_inspection_date) : null,
          criticality: item.criticality,
          condition_score: item.condition_score,
          traffic_level: item.traffic_level,
          total_past_defects: item.total_past_defects,
          total_past_failures: item.total_past_failures,
          status: item.current_status || item.status || 'active',
          replacement_cost_estimate: item.replacement_cost_estimate
        }
      });
    }

    // 4. Load defect/maintenance records
    console.log(`[ETL] Loading ${tmsData.length} track defects...`);
    for (const item of tmsData) {
      await prisma.trackMaintenance.create({
        data: {
          id: item.id,
          asset_id: item.asset_id,
          asset_type: item.asset_type,
          location_km: item.location_km,
          defect_type: item.defect_type,
          severity: item.severity,
          description: item.description,
          reported_by: item.reported_by,
          reported_at: new Date(item.reported_at),
          is_deleted: item.is_deleted,
          created_by: item.created_by,
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at),
          criticality: item.criticality,
          overdue_days: item.overdue_days,
          preferred_start_time: item.preferred_start_time ? new Date(item.preferred_start_time) : null,
          preferred_end_time: item.preferred_end_time ? new Date(item.preferred_end_time) : null,
          crew_size: item.crew_size
        }
      });
    }

    console.log(`[ETL] Loading ${tdmsData.length} traction defects...`);
    for (const item of tdmsData) {
      await prisma.tractionMaintenance.create({
        data: {
          id: item.id,
          asset_id: item.asset_id,
          loco_number: item.loco_number,
          loco_type: item.loco_type,
          defect_type: item.defect_type,
          severity: item.severity,
          description: item.description,
          depot: item.depot,
          reported_by: item.reported_by,
          reported_at: new Date(item.reported_at),
          is_deleted: item.is_deleted,
          created_by: item.created_by,
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at),
          criticality: item.criticality,
          overdue_days: item.overdue_days,
          preferred_start_time: item.preferred_start_time ? new Date(item.preferred_start_time) : null,
          preferred_end_time: item.preferred_end_time ? new Date(item.preferred_end_time) : null,
          crew_size: item.crew_size
        }
      });
    }

    console.log(`[ETL] Loading ${smmsData.length} signal defects...`);
    for (const item of smmsData) {
      await prisma.signallingMaintenance.create({
        data: {
          id: item.id,
          asset_id: item.asset_id,
          signal_id: item.signal_id,
          signal_type: item.signal_type,
          location_km: item.location_km,
          defect_type: item.defect_type,
          severity: item.severity,
          description: item.description,
          reported_by: item.reported_by,
          reported_at: new Date(item.reported_at),
          is_deleted: item.is_deleted,
          created_by: item.created_by,
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at),
          criticality: item.criticality,
          overdue_days: item.overdue_days,
          preferred_start_time: item.preferred_start_time ? new Date(item.preferred_start_time) : null,
          preferred_end_time: item.preferred_end_time ? new Date(item.preferred_end_time) : null,
          crew_size: item.crew_size
        }
      });
    }

    // 5. Load coa_train_operations.json
    console.log(`[ETL] Loading ${coaData.length} train operations...`);
    for (const item of coaData) {
      await prisma.trainOperations.create({
        data: {
          id: item.id,
          train_number: item.train_number,
          from_station: item.from_station,
          to_station: item.to_station,
          departure_time: new Date(item.departure_time),
          arrival_time: new Date(item.arrival_time),
          status: item.status,
          delay_minutes: item.delay_minutes,
          section: item.section,
          created_at: new Date(item.created_at),
          updated_at: new Date(item.updated_at)
        }
      });
    }

    // 6. Load planning_maintenance_history.json
    console.log(`[ETL] Loading ${historyData.length} maintenance history records...`);
    for (const item of historyData) {
      await prisma.maintenanceHistory.create({
        data: {
          id: item.id,
          task_id: item.task_id || null,
          asset_id: item.asset_id,
          division: item.division,
          completed_date: item.completed_date ? new Date(item.completed_date) : null,
          estimated_duration_min: item.estimated_duration_min,
          actual_repair_duration_min: item.actual_repair_duration_min,
          duration_variance_min: item.duration_variance_min,
          was_delayed: item.was_delayed,
          delay_reason: item.delay_reason,
          did_fail_within_30_days: item.did_fail_within_30_days,
          days_to_failure: item.days_to_failure,
          crew_size_used: item.crew_size_used,
          cost_incurred: item.cost_incurred,
          weather_condition: item.weather_condition,
          remarks: item.remarks,
          action: item.action || 'completed',
          old_status: item.old_status || 'pending',
          new_status: item.new_status || 'completed',
          notes: item.notes || null,
          performed_by: item.performed_by || 'sample-data-generator',
          created_at: item.created_at ? new Date(item.created_at) : (item.completed_date ? new Date(item.completed_date) : new Date())
        }
      });
    }

    // 7. Normalization step: reads the three maintenance tables and populates planning.maintenance_tasks
    console.log('[ETL] Normalizing defects into planning.maintenance_tasks...');
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

    console.log(`[ETL] Normalization completed: ${succeeded} succeeded, ${failed} failed.`);
    if (failed > 0) {
      const firstFailure = results.find((result) => result.status === 'rejected');
      throw firstFailure.reason;
    }
    console.log('[ETL] Data loading finished successfully!');

    return {
      assets: assetsData.length,
      track_defects: tmsData.length,
      traction_defects: tdmsData.length,
      signal_defects: smmsData.length,
      trains: coaData.length,
      history: historyData.length,
      normalized_tasks: succeeded
    };

  } catch (error) {
    console.error('[ETL] Critical error during data load:', error);
    throw error;
  }
}

module.exports = { runEtlLoader };