// src/services/etlRunner.js — deterministic multi-day synthetic data generator for the existing Prisma schema
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { normalizeTmsDefect, normalizeTdmsDefect, normalizeSmmsDefect } = require('./etl');

const DATA_DIR = path.join(__dirname, '../../data');

function createRng(seed) {
  let t = (seed >>> 0) || 42;
  return function next() {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, items) {
  return items[Math.floor(rng() * items.length)];
}

function weightedPick(rng, choices) {
  const totalWeight = choices.reduce((sum, item) => sum + item.weight, 0);
  let threshold = rng() * totalWeight;
  for (const choice of choices) {
    threshold -= choice.weight;
    if (threshold <= 0) return choice.value;
  }
  return choices[choices.length - 1].value;
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomFloat(rng, min, max) {
  return Number((min + (max - min) * rng()).toFixed(2));
}

function scenarioForDay(dayIndex, seed) {
  const scenarios = [
    { name: 'normal', maintenanceMultiplier: 1, trafficMultiplier: 1, delayBias: 0.12, nightShare: 0.15 },
    { name: 'high-maintenance', maintenanceMultiplier: 1.7, trafficMultiplier: 1.05, delayBias: 0.16, nightShare: 0.22 },
    { name: 'low-maintenance', maintenanceMultiplier: 0.55, trafficMultiplier: 0.88, delayBias: 0.08, nightShare: 0.12 },
    { name: 'high-traffic', maintenanceMultiplier: 1.2, trafficMultiplier: 1.38, delayBias: 0.2, nightShare: 0.18 },
    { name: 'low-traffic', maintenanceMultiplier: 1.4, trafficMultiplier: 0.7, delayBias: 0.09, nightShare: 0.27 },
    { name: 'congested', maintenanceMultiplier: 1.4, trafficMultiplier: 1.5, delayBias: 0.25, nightShare: 0.16 },
    { name: 'emergency-day', maintenanceMultiplier: 1.9, trafficMultiplier: 1.2, delayBias: 0.28, nightShare: 0.24 },
    { name: 'delay-heavy', maintenanceMultiplier: 1.1, trafficMultiplier: 1.15, delayBias: 0.35, nightShare: 0.14 },
    { name: 'night-maintenance', maintenanceMultiplier: 1.8, trafficMultiplier: 0.95, delayBias: 0.14, nightShare: 0.45 },
    { name: 'mixed', maintenanceMultiplier: 1.55, trafficMultiplier: 1.28, delayBias: 0.22, nightShare: 0.32 },
  ];

  return scenarios[(dayIndex + seed) % scenarios.length];
}

function buildSyntheticData({ days = 30, seed = 42 } = {}) {
  const rng = createRng(seed);
  const baseDate = new Date();
  baseDate.setUTCHours(0, 0, 0, 0);
  baseDate.setUTCDate(baseDate.getUTCDate() - (days - 1));

  const citySections = ['CSMT-Kalyan', 'HWH-BDC', 'NDLS-GZB', 'MAS-AJJ', 'SBC-YPR'];
  const stationNames = ['Kalyan', 'Nagpur', 'Bhopal', 'Howrah', 'Bandra', 'Nizamuddin', 'Chennai', 'Bengaluru', 'Delhi', 'Lucknow', 'Kolkata', 'Hubballi'];
  const assetZones = ['CR', 'ER', 'NR', 'SR', 'SWR'];
  const trackAssets = ['rail', 'sleeper', 'switch', 'ballast', 'track_geometry'];
  const signalAssets = ['signal', 'interlocking', 'track_circuit', 'control_panel'];
  const tractionAssets = ['pantograph', 'traction_motor', 'converter', 'brake_system'];
  const departments = [
    { department: 'TMS', assetType: 'track', prefix: 'TRK', templates: trackAssets, count: 72 },
    { department: 'SMMS', assetType: 'signal', prefix: 'SIG', templates: signalAssets, count: 64 },
    { department: 'TDMS', assetType: 'traction', prefix: 'TRN', templates: tractionAssets, count: 64 },
  ];

  const assets = [];
  let assetCounter = 1;

  for (const dept of departments) {
    for (let i = 0; i < dept.count; i += 1) {
      const zone = pick(rng, assetZones);
      const section = pick(rng, citySections);
      const station = pick(rng, stationNames);
      const locationKm = randomFloat(rng, 10, 430);
      const assetId = `${dept.prefix}-${zone}-${String(assetCounter).padStart(4, '0')}`;
      const assetType = dept.assetType;
      const name = `${dept.department} ${assetType} ${assetCounter}`;
      const conditionScore = randomFloat(rng, 54, 96);
      assets.push({
        asset_id: assetId,
        asset_code: assetId,
        department: dept.department,
        asset_type: assetType,
        name,
        asset_specification: pick(rng, dept.templates),
        zone,
        division: `${zone}-Division-${randomInt(rng, 1, 6)}`,
        section,
        station_location: station,
        location_km: locationKm,
        gauge: assetType === 'track' ? pick(rng, ['BG', 'MG', 'DG']) : 'EMU',
        manufacturer: pick(rng, ['Siemens', 'Alstom', 'BHEL', 'IR', 'Kec', 'GE']),
        installation_date: new Date(Date.now() - randomInt(rng, 365, 18000) * 24 * 60 * 60 * 1000).toISOString(),
        design_life_years: randomInt(rng, 12, 35),
        last_major_maintenance_date: new Date(Date.now() - randomInt(rng, 20, 1200) * 24 * 60 * 60 * 1000).toISOString(),
        last_inspection_date: new Date(Date.now() - randomInt(rng, 5, 180) * 24 * 60 * 60 * 1000).toISOString(),
        criticality: weightedPick(rng, [
          { value: 'low', weight: 1 },
          { value: 'medium', weight: 3 },
          { value: 'high', weight: 4 },
          { value: 'critical', weight: 2 },
        ]),
        condition_score: conditionScore,
        traffic_level: randomInt(rng, 35, 210),
        total_past_defects: randomInt(rng, 1, 30),
        total_past_failures: randomInt(rng, 0, 8),
        current_status: weightedPick(rng, [
          { value: 'active', weight: 8 },
          { value: 'monitoring', weight: 1 },
          { value: 'restricted', weight: 1 },
        ]),
        replacement_cost_estimate: randomFloat(rng, 150000, 6800000),
      });
      assetCounter += 1;
    }
  }

  const trackAssetsByDept = assets.filter((asset) => asset.department === 'TMS');
  const signalAssetsByDept = assets.filter((asset) => asset.department === 'SMMS');
  const tractionAssetsByDept = assets.filter((asset) => asset.department === 'TDMS');

  const defectTemplates = {
    TMS: [
      { defect_type: 'rail_fracture', description: 'Longitudinal rail fracture has developed near sleeper gap', severity: 'critical' },
      { defect_type: 'track_alignment_fault', description: 'Track geometry drift observed on high-speed approach', severity: 'high' },
      { defect_type: 'ballast_deficiency', description: 'Ballast settlement causing uneven support under the rail seat', severity: 'medium' },
      { defect_type: 'sleeper_crack', description: 'Sleeper cracking detected near turnout area', severity: 'medium' },
      { defect_type: 'weld_failure', description: 'Weld defect with visible crack initiation', severity: 'high' },
      { defect_type: 'turnout_issue', description: 'Switch blade wear requiring lubrication and inspection', severity: 'medium' },
      { defect_type: 'track_inspection_findings', description: 'Track recording indicates localised gauge variation', severity: 'low' },
    ],
    SMMS: [
      { defect_type: 'interlocking_error', description: 'Signal interlocking mismatch between adjacent routes', severity: 'critical' },
      { defect_type: 'point_failure', description: 'Point machine movement slow and unstable under load', severity: 'high' },
      { defect_type: 'track_circuit_fault', description: 'Track circuit failure leads to false occupancy indication', severity: 'high' },
      { defect_type: 'cabling_damage', description: 'Cable sheath damage found near signal hut', severity: 'medium' },
      { defect_type: 'aspect_signal_lamp_out', description: 'Signal lamp output degraded under low-light conditions', severity: 'medium' },
      { defect_type: 'relay_contact_erosion', description: 'Relay contacts show wear and intermittent signal relay drop', severity: 'low' },
    ],
    TDMS: [
      { defect_type: 'overhead_catenary_sag', description: 'Overhead contact wire sag exceeds maintenance threshold', severity: 'high' },
      { defect_type: 'pantograph_damage', description: 'Pantograph carbon strip wear causing arcing', severity: 'medium' },
      { defect_type: 'loco_motor_defect', description: 'Traction motor vibration above expected tolerance', severity: 'high' },
      { defect_type: 'substation_tripped', description: 'Substation feeder tripped during load transfer', severity: 'critical' },
      { defect_type: 'isolator_fault', description: 'Isolator switch exhibits intermittent contact resistance', severity: 'medium' },
      { defect_type: 'electrical_inspection_findings', description: 'Insulation resistance below desired limit', severity: 'low' },
    ],
  };

  const tmsData = [];
  const tdmsData = [];
  const smmsData = [];
  const coaData = [];
  const historyData = [];

  const trainRoutes = [
    ['CSMT', 'Kalyan'], ['Kalyan', 'Bandra'], ['Howrah', 'Burdwan'], ['Delhi', 'Lucknow'], ['Bengaluru', 'Mysuru'], ['Nagpur', 'Bhopal'], ['Chennai', 'Madurai'], ['Bengaluru', 'Hubballi'], ['Mumbai', 'Ahmedabad'], ['Kolkata', 'Asansol'],
  ];
  const stations = ['CSMT', 'Kalyan', 'Bandra', 'Bhopal', 'Nagpur', 'Howrah', 'Burdwan', 'Delhi', 'Lucknow', 'Chennai', 'Madurai', 'Bengaluru', 'Hubballi'];

  for (let dayIndex = 0; dayIndex < days; dayIndex += 1) {
    const dayDate = new Date(baseDate);
    dayDate.setUTCDate(dayDate.getUTCDate() + dayIndex);
    const scenario = scenarioForDay(dayIndex, seed);

    const tmsCount = Math.max(4, Math.round(7 * scenario.maintenanceMultiplier + rng() * 9));
    const tdmsCount = Math.max(3, Math.round(4 * scenario.maintenanceMultiplier + rng() * 8));
    const smmsCount = Math.max(3, Math.round(5 * scenario.maintenanceMultiplier + rng() * 9));
    const trainCount = Math.max(20, Math.round((28 + rng() * 18) * scenario.trafficMultiplier));

    for (let i = 0; i < tmsCount; i += 1) {
      const asset = pick(rng, trackAssetsByDept);
      const template = pick(rng, defectTemplates.TMS);
      const startHour = randomInt(rng, 4, 22);
      const durationHours = randomInt(rng, 2, 8);
      const reportedAt = new Date(dayDate);
      reportedAt.setUTCHours(startHour, randomInt(rng, 0, 59), 0, 0);
      const preferredStart = new Date(reportedAt);
      const preferredEnd = new Date(reportedAt);
      preferredEnd.setUTCHours(preferredStart.getUTCHours() + durationHours, randomInt(rng, 0, 59), 0, 0);

      const item = {
        id: `TMS-${dayIndex + 1}-${i + 1}-${seed}`,
        asset_id: asset.asset_id,
        asset_type: 'track',
        location_km: Number((asset.location_km + randomFloat(rng, -2.5, 2.5)).toFixed(2)),
        defect_type: template.defect_type,
        severity: weightedPick(rng, [
          { value: 'low', weight: 2 },
          { value: 'medium', weight: 4 },
          { value: 'high', weight: 3 },
          { value: 'critical', weight: 1 },
        ]),
        description: template.description,
        reported_by: pick(rng, ['track-inspector', 'maintenance-control', 'maintenance-engineer', 'section-foreman']),
        reported_at: reportedAt.toISOString(),
        is_deleted: false,
        created_by: 'synthetic-data-generator',
        created_at: reportedAt.toISOString(),
        updated_at: reportedAt.toISOString(),
        criticality: asset.criticality,
        overdue_days: randomInt(rng, 0, 12),
        preferred_start_time: preferredStart.toISOString(),
        preferred_end_time: preferredEnd.toISOString(),
        crew_size: randomInt(rng, 2, 8),
      };
      tmsData.push(item);

      if (rng() < 0.38) {
        historyData.push({
          id: `H-TMS-${dayIndex + 1}-${i + 1}-${seed}`,
          task_id: null,
          asset_id: asset.asset_id,
          division: asset.division,
          completed_date: new Date(reportedAt.getTime() + randomInt(rng, 1, 9) * 60 * 60 * 1000).toISOString(),
          estimated_duration_min: durationHours * 60,
          actual_repair_duration_min: durationHours * 60 + randomInt(rng, -25, 85),
          duration_variance_min: randomInt(rng, -31, 70),
          was_delayed: rng() < 0.35,
          delay_reason: pick(rng, ['weather', 'crew availability', 'material delay', 'train conflict']),
          did_fail_within_30_days: rng() < 0.12,
          days_to_failure: rng() < 0.12 ? randomInt(rng, 3, 28) : null,
          crew_size_used: item.crew_size,
          cost_incurred: randomFloat(rng, 2500, 90000),
          weather_condition: pick(rng, ['clear', 'light_rain', 'moderate_rain', 'fog']),
          remarks: `${template.defect_type} resolved with routine inspection and corrective work`,
          action: 'completed',
          old_status: 'pending',
          new_status: 'completed',
          performed_by: 'synthetic-data-generator',
          created_at: reportedAt.toISOString(),
        });
      }
    }

    for (let i = 0; i < tdmsCount; i += 1) {
      const asset = pick(rng, tractionAssetsByDept);
      const template = pick(rng, defectTemplates.TDMS);
      const startHour = randomInt(rng, 2, 23);
      const reportedAt = new Date(dayDate);
      reportedAt.setUTCHours(startHour, randomInt(rng, 0, 59), 0, 0);
      const durationHours = randomInt(rng, 2, 6);

      const item = {
        id: `TDMS-${dayIndex + 1}-${i + 1}-${seed}`,
        asset_id: asset.asset_id,
        loco_number: `LOCO-${randomInt(rng, 100, 999)}`,
        loco_type: pick(rng, ['electric', 'diesel']),
        defect_type: template.defect_type,
        severity: weightedPick(rng, [
          { value: 'low', weight: 2 },
          { value: 'medium', weight: 4 },
          { value: 'high', weight: 3 },
          { value: 'critical', weight: 2 },
        ]),
        description: template.description,
        depot: pick(rng, ['Bandra', 'Allahabad', 'Bhopal', 'Delhi', 'Bengaluru', 'Howrah']),
        reported_by: pick(rng, ['traction-ops', 'rolling-stock-maintenance', 'electrician', 'depot-manager']),
        reported_at: reportedAt.toISOString(),
        is_deleted: false,
        created_by: 'synthetic-data-generator',
        created_at: reportedAt.toISOString(),
        updated_at: reportedAt.toISOString(),
        criticality: asset.criticality,
        overdue_days: randomInt(rng, 0, 14),
        preferred_start_time: reportedAt.toISOString(),
        preferred_end_time: new Date(reportedAt.getTime() + durationHours * 60 * 60 * 1000).toISOString(),
        crew_size: randomInt(rng, 3, 10),
      };
      tdmsData.push(item);
    }

    for (let i = 0; i < smmsCount; i += 1) {
      const asset = pick(rng, signalAssetsByDept);
      const template = pick(rng, defectTemplates.SMMS);
      const startHour = randomInt(rng, 1, 23);
      const reportedAt = new Date(dayDate);
      reportedAt.setUTCHours(startHour, randomInt(rng, 0, 59), 0, 0);
      const durationHours = randomInt(rng, 2, 7);

      const item = {
        id: `SMMS-${dayIndex + 1}-${i + 1}-${seed}`,
        asset_id: asset.asset_id,
        signal_id: `SIG-${randomInt(rng, 100, 9999)}`,
        signal_type: pick(rng, ['LED', 'colour_light', 'electric']),
        location_km: Number((asset.location_km + randomFloat(rng, -3, 3)).toFixed(2)),
        defect_type: template.defect_type,
        severity: weightedPick(rng, [
          { value: 'low', weight: 2 },
          { value: 'medium', weight: 4 },
          { value: 'high', weight: 3 },
          { value: 'critical', weight: 2 },
        ]),
        description: template.description,
        reported_by: pick(rng, ['signal-maintenance', 'control-office', 'signalling-inspector', 'signal-tech']),
        reported_at: reportedAt.toISOString(),
        is_deleted: false,
        created_by: 'synthetic-data-generator',
        created_at: reportedAt.toISOString(),
        updated_at: reportedAt.toISOString(),
        criticality: asset.criticality,
        overdue_days: randomInt(rng, 0, 10),
        preferred_start_time: reportedAt.toISOString(),
        preferred_end_time: new Date(reportedAt.getTime() + durationHours * 60 * 60 * 1000).toISOString(),
        crew_size: randomInt(rng, 2, 7),
      };
      smmsData.push(item);
    }

    for (let i = 0; i < trainCount; i += 1) {
      const [from, to] = pick(rng, trainRoutes);
      const departure = new Date(dayDate);
      const departureHour = randomInt(rng, 0, 23);
      const departureMinute = pick(rng, [0, 15, 30, 45]);
      departure.setUTCHours(departureHour, departureMinute, 0, 0);
      const travelMinutes = randomInt(rng, 70, 260);
      const arrival = new Date(departure.getTime() + travelMinutes * 60 * 1000);
      const status = weightedPick(rng, [
        { value: 'on_time', weight: 78 },
        { value: 'delayed', weight: 16 },
        { value: 'cancelled', weight: 6 },
      ]);
      const delayMinutes = status === 'delayed' ? randomInt(rng, 8, 65) : null;
      coaData.push({
        id: `COA-${dayIndex + 1}-${i + 1}-${seed}`,
        train_number: `TRAIN-${String(randomInt(rng, 101, 989)).padStart(3, '0')}`,
        from_station: from,
        to_station: to,
        departure_time: departure.toISOString(),
        arrival_time: arrival.toISOString(),
        status,
        delay_minutes: delayMinutes,
        section: pick(rng, citySections),
        created_at: departure.toISOString(),
        updated_at: departure.toISOString(),
      });
    }
  }

  return {
    assets,
    tmsData,
    tdmsData,
    smmsData,
    coaData,
    historyData,
  };
}

async function generateSyntheticBlockPlans({ days = 30, seed = 42 } = {}) {
  const tasks = await prisma.maintenanceTask.findMany({
    where: { is_deleted: false },
    orderBy: { priority_score: 'desc' },
    select: {
      id: true,
      department: true,
      asset_id: true,
      location: true,
      severity: true,
      task_type: true,
      priority_score: true,
    },
  });

  if (!tasks.length) {
    return { block_demands: 0, block_plans: 0 };
  }

  await prisma.conflict.deleteMany({});
  await prisma.blockPlanTrain.deleteMany({});
  await prisma.approvedBlockPlan.deleteMany({});
  await prisma.blockPlan.deleteMany({});
  await prisma.blockDemand.deleteMany({});

  const sections = ['CSMT-Kalyan', 'Kalyan-Bandra', 'NDLS-GZB', 'MAS-AJJ', 'SBC-YPR', 'HWH-BDC'];
  const baseDate = new Date();
  baseDate.setUTCHours(0, 0, 0, 0);

  let blockDemandCount = 0;
  let blockPlanCount = 0;

  for (let dayOffset = 0; dayOffset < Math.min(days, 14); dayOffset += 1) {
    const dayStart = new Date(baseDate);
    dayStart.setUTCDate(dayStart.getUTCDate() + dayOffset);
    const dailyPlans = 2 + ((dayOffset + seed) % 4);

    for (let slot = 0; slot < dailyPlans; slot += 1) {
      const section = sections[(dayOffset + slot + seed) % sections.length];
      const fromKm = 18 + ((dayOffset * 13 + slot * 17 + seed) % 160);
      const toKm = fromKm + 6 + ((slot + seed) % 8);
      const start = new Date(dayStart);
      start.setUTCHours(1 + ((dayOffset + slot + seed) % 18), 0, 0, 0);
      const end = new Date(start);
      end.setUTCHours(start.getUTCHours() + 3 + ((slot + seed) % 5), 0, 0, 0);
      const weekStart = new Date(dayStart);
      weekStart.setUTCDate(weekStart.getUTCDate() - weekStart.getUTCDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
      weekEnd.setUTCHours(23, 59, 59, 999);

      const demand = await prisma.blockDemand.create({
        data: {
          section,
          from_km: fromKm,
          to_km: toKm,
          demanded_by: 'control-office',
          demanded_for: start,
          duration_hours: (end.getTime() - start.getTime()) / 3600000,
          reason: `${section} maintenance corridor window`,
          status: 'pending',
        },
      });
      blockDemandCount += 1;

      const chosenTasks = [];
      for (let offset = 0; offset < 3; offset += 1) {
        const taskIndex = (dayOffset * 3 + slot * 2 + offset + seed) % tasks.length;
        const task = tasks[taskIndex];
        if (task && !chosenTasks.some((item) => item.id === task.id)) {
          chosenTasks.push(task);
        }
      }

      const status = (dayOffset + slot + seed) % 3 === 0 ? 'approved' : 'pending';
      const plan = await prisma.blockPlan.create({
        data: {
          section,
          from_km: fromKm,
          to_km: toKm,
          planned_start: start,
          planned_end: end,
          week_start: weekStart,
          week_end: weekEnd,
          status,
          block_demand_id: demand.id,
          conflict_flags: {
            source: 'synthetic-plan-generator',
            corridor: section,
            capacity_score: 72 + ((dayOffset + slot + seed) % 20),
          },
          trains: {
            create: chosenTasks.map((task) => ({
              task_id: task.id,
              train_number: `PLAN-${String((dayOffset + slot + 1) * 10 + seed).padStart(4, '0')}`,
              impact_type: task.department === 'TDMS' ? 'traction' : task.department === 'SMMS' ? 'signalling' : 'track',
              notes: `${task.task_type} work window`,
            })),
          },
        },
      });
      blockPlanCount += 1;

      if ((dayOffset + slot + seed) % 4 === 0) {
        await prisma.conflict.create({
          data: {
            block_plan_id: plan.id,
            conflict_type: 'capacity',
            description: `${section} corridor overlap during maintenance window`,
            severity: 'medium',
          },
        });
      }
    }
  }

  return { block_demands: blockDemandCount, block_plans: blockPlanCount };
}

let etlRunPromise = null;

async function runEtlLoader() {
  if (etlRunPromise) {
    return etlRunPromise;
  }

  etlRunPromise = (async () => {
    const days = Number(process.env.DAYS || 30);
    const seed = Number(process.env.SYNTHETIC_SEED || 42);
    console.log(`[ETL] Generating ${days}-day synthetic dataset using seed ${seed}...`);

    try {
      const generated = buildSyntheticData({ days, seed });
      const { assets, tmsData, tdmsData, smmsData, coaData, historyData } = generated;

      fs.mkdirSync(DATA_DIR, { recursive: true });
      const persisted = {
        core_assets: assets,
        tms_track_maintenance: tmsData,
        tdms_traction_maintenance: tdmsData,
        smms_signalling_maintenance: smmsData,
        coa_train_operations: coaData,
        planning_maintenance_history: historyData,
      };

      for (const [fileName, rows] of Object.entries(persisted)) {
        fs.writeFileSync(path.join(DATA_DIR, `${fileName}.json`), JSON.stringify(rows, null, 2));
      }

      const assetIds = new Set(assets.map((item) => item.asset_id || item.id));
      const linkedRows = [...tmsData, ...tdmsData, ...smmsData, ...historyData];
      const invalidReferences = linkedRows.filter((item) => item.asset_id && !assetIds.has(item.asset_id));
      if (invalidReferences.length > 0) {
        throw new Error(`[ETL] ${invalidReferences.length} records reference an unknown asset_id`);
      }

      console.log('[ETL] Clearing existing data from tables...');
      await prisma.maintenanceHistory.deleteMany({});
      await prisma.maintenanceTask.deleteMany({});
      await prisma.trackMaintenance.deleteMany({});
      await prisma.tractionMaintenance.deleteMany({});
      await prisma.signallingMaintenance.deleteMany({});
      await prisma.trainOperations.deleteMany({});
      await prisma.asset.deleteMany({});
      console.log('[ETL] Tables cleared successfully.');

      console.log(`[ETL] Loading ${assets.length} core assets...`);
      for (const item of assets) {
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
            replacement_cost_estimate: item.replacement_cost_estimate,
          },
        });
      }

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
            crew_size: item.crew_size,
          },
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
            crew_size: item.crew_size,
          },
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
            crew_size: item.crew_size,
          },
        });
      }

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
            updated_at: new Date(item.updated_at),
          },
        });
      }

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
            performed_by: item.performed_by || 'synthetic-data-generator',
            created_at: item.created_at ? new Date(item.created_at) : new Date(),
          },
        });
      }

      console.log('[ETL] Normalizing defects into planning.maintenance_tasks...');
      const [tmsRecords, tdmsRecords, smmsRecords] = await Promise.all([
        prisma.trackMaintenance.findMany({ where: { is_deleted: false } }),
        prisma.tractionMaintenance.findMany({ where: { is_deleted: false } }),
        prisma.signallingMaintenance.findMany({ where: { is_deleted: false } }),
      ]);

      const results = await Promise.allSettled([
        ...tmsRecords.map((record) => normalizeTmsDefect(record)),
        ...tdmsRecords.map((record) => normalizeTdmsDefect(record)),
        ...smmsRecords.map((record) => normalizeSmmsDefect(record)),
      ]);

      const succeeded = results.filter((result) => result.status === 'fulfilled').length;
      const failed = results.filter((result) => result.status === 'rejected').length;
      console.log(`[ETL] Normalization completed: ${succeeded} succeeded, ${failed} failed.`);

      if (failed > 0) {
        const firstFailure = results.find((result) => result.status === 'rejected');
        throw firstFailure.reason;
      }

      console.log('[ETL] Generating synthetic block-plan coverage for the calendar...');
      const blockSummary = await generateSyntheticBlockPlans({ days, seed });
      console.log(`[ETL] Calendar plans generated: ${blockSummary.block_plans} plans across ${blockSummary.block_demands} demands.`);

      console.log('[ETL] Data loading finished successfully!');
      return {
        assets: assets.length,
        track_defects: tmsData.length,
        traction_defects: tdmsData.length,
        signal_defects: smmsData.length,
        trains: coaData.length,
        history: historyData.length,
        normalized_tasks: succeeded,
        block_plans: blockSummary.block_plans,
        block_demands: blockSummary.block_demands,
      };
    } catch (error) {
      console.error('[ETL] Critical error during data load:', error);
      throw error;
    } finally {
      etlRunPromise = null;
    }
  })();

  return etlRunPromise;
}

module.exports = { runEtlLoader };
