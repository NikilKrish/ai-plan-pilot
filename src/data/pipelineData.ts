import { stationsByLine, kbSnippets as existingSnippets } from './sampleData';

// ── Pipeline Health ──────────────────────────────────────────────
export interface StreamingHealth {
  status: 'Healthy' | 'Degraded' | 'Down';
  source: string;
  lagSec: number;
  lastEventTs: string;
  validationPassPct: number;
}

export interface BatchHealth {
  status: 'Healthy' | 'Degraded' | 'Down';
  sources: string[];
  lastSyncTs: string;
  rowsProcessed: number;
  validationErrors: number;
}

export const pipelineHealth = {
  streaming: {
    status: 'Healthy' as const,
    source: 'Kafka / Event Bus',
    lagSec: 1.4,
    lastEventTs: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    validationPassPct: 99.2,
  },
  batch: {
    status: 'Healthy' as const,
    sources: ['MES DB', 'Planning DB'],
    lastSyncTs: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    rowsProcessed: 24_830,
    validationErrors: 3,
  },
};

// ── Ingestion Events ─────────────────────────────────────────────
export interface IngestionEvent {
  id: string;
  ts: string;
  sourceType: 'machine' | 'mes' | 'planning';
  entityType: string;
  lineId: string;
  stationId?: string;
  status: 'validated' | 'dropped';
  reason?: string;
}

const sourceTypes: IngestionEvent['sourceType'][] = ['machine', 'mes', 'planning'];
const entityTypes = ['cycle_log', 'downtime_event', 'quality_report', 'shift_plan', 'production_order'];
const lines = ['LINE_A', 'LINE_B', 'LINE_C'];
const dropReasons = ['Schema mismatch', 'Missing timestamp', 'Duplicate key', 'Value out of range'];

export const makeIngestionEvents = (): IngestionEvent[] => {
  const events: IngestionEvent[] = [];
  const now = Date.now();
  for (let i = 0; i < 20; i++) {
    const lineId = lines[i % 3];
    const stationsForLine = stationsByLine[lineId];
    const isDropped = i === 3 || i === 14;
    events.push({
      id: `EVT_${1000 + i}`,
      ts: new Date(now - i * 45_000).toISOString(),
      sourceType: sourceTypes[i % 3],
      entityType: entityTypes[i % 5],
      lineId,
      stationId: i % 4 !== 0 ? stationsForLine[i % stationsForLine.length].stationId : undefined,
      status: isDropped ? 'dropped' : 'validated',
      reason: isDropped ? dropReasons[i % dropReasons.length] : undefined,
    });
  }
  return events;
};

// ── Feature Snapshots ────────────────────────────────────────────
export interface FeatureSnapshot {
  lineId: string;
  stationId: string;
  stationName: string;
  availabilityPct: number;
  effectiveCycleTimeSec: number;
  downtimeNormalizedPct: number;
  scrapProxyPct: number;
  rollupLevel: 'station' | 'line';
  ts: string;
}

export const buildFeatureSnapshots = (): FeatureSnapshot[] => {
  const snapshots: FeatureSnapshot[] = [];
  const now = new Date().toISOString();
  Object.entries(stationsByLine).forEach(([lineId, stations]) => {
    stations.forEach((s) => {
      const shiftMin = 480; // 8h
      const availPct = Math.round(((shiftMin - s.downtimeMinPerShift) / shiftMin) * 1000) / 10;
      const effCycle = +(s.meanCycleTimeSec * (1 + s.variancePct / 100)).toFixed(1);
      const dtNorm = +(s.downtimeMinPerShift / shiftMin * 100).toFixed(1);
      snapshots.push({
        lineId,
        stationId: s.stationId,
        stationName: s.stationName,
        availabilityPct: availPct,
        effectiveCycleTimeSec: effCycle,
        downtimeNormalizedPct: dtNorm,
        scrapProxyPct: s.scrapPct,
        rollupLevel: 'station',
        ts: now,
      });
    });
  });
  return snapshots;
};

// ── Model Runs ───────────────────────────────────────────────────
export interface ModelRun {
  id: string;
  name: string;
  techniqueLabel: string;
  ts: string;
  status: 'ok' | 'warning' | 'stale';
  confidence: number;
  drift: 'low' | 'med' | 'high';
  notes: string;
  inputs: string[];
  outputs: string[];
  whyItMatters: string[];
}

export const makeModelRuns = (): ModelRun[] => [
  {
    id: 'downtimeForecast',
    name: 'Downtime Forecasting',
    techniqueLabel: 'ARIMA / LSTM',
    ts: new Date(Date.now() - 12 * 60_000).toISOString(),
    status: 'ok',
    confidence: 0.91,
    drift: 'low',
    notes: 'Retrained 2h ago on latest MES feed',
    inputs: ['Historical downtime logs', 'Maintenance schedules', 'Machine sensor data'],
    outputs: ['Predicted downtime windows per station', 'Probability distributions', 'Anomaly flags'],
    whyItMatters: [
      'Enables proactive maintenance scheduling to minimize unplanned stoppages',
      'Directly improves availability from ~82% to ~88% by anticipating failures',
    ],
  },
  {
    id: 'cycleTimeModel',
    name: 'Cycle Time Variability',
    techniqueLabel: 'Regression / ML',
    ts: new Date(Date.now() - 18 * 60_000).toISOString(),
    status: 'ok',
    confidence: 0.87,
    drift: 'low',
    notes: 'Stable coefficients across last 5 runs',
    inputs: ['Station cycle time distributions', 'Operator shift data', 'Material batch IDs'],
    outputs: ['Effective cycle time per station', 'Variance decomposition', 'Trend direction'],
    whyItMatters: [
      'Identifies stations with inconsistent performance for targeted improvement',
      'Reduces average cycle time from ~62s to ~58s through variance reduction',
    ],
  },
  {
    id: 'capacityPrediction',
    name: 'Capacity Prediction',
    techniqueLabel: 'Supervised ML',
    ts: new Date(Date.now() - 8 * 60_000).toISOString(),
    status: 'ok',
    confidence: 0.93,
    drift: 'low',
    notes: 'Using ensemble of gradient-boosted trees',
    inputs: ['Station features (cycle time, availability, scrap)', 'Shift configuration', 'Historical throughput'],
    outputs: ['Predicted capacity units/day', 'Confidence interval', 'Key impact drivers'],
    whyItMatters: [
      'Powers the planner co-pilot with accurate capacity estimates',
      'Improves planned vs actual gap from ~12% to ~4%',
    ],
  },
  {
    id: 'bottleneckDetection',
    name: 'Bottleneck Detection',
    techniqueLabel: 'Rules / Classification',
    ts: new Date(Date.now() - 5 * 60_000).toISOString(),
    status: 'warning',
    confidence: 0.85,
    drift: 'med',
    notes: 'Line C showing new pattern — monitoring',
    inputs: ['Effective cycle times', 'Throughput ratios', 'WIP accumulation signals'],
    outputs: ['Ranked bottleneck stations', 'Impact percentages', 'Root cause classification'],
    whyItMatters: [
      'Surfaces the #1 constraint limiting line throughput in real-time',
      'Reduces chronic bottleneck stations from ~3 to ~1 per line',
    ],
  },
  {
    id: 'optimization',
    name: 'Plan Optimization',
    techniqueLabel: 'Constraint Optimization',
    ts: new Date(Date.now() - 3 * 60_000).toISOString(),
    status: 'ok',
    confidence: 0.89,
    drift: 'low',
    notes: 'Solver converged in 340ms',
    inputs: ['Capacity predictions', 'Demand targets', 'Shift constraints', 'Cost parameters'],
    outputs: ['Optimized shift/hour recommendations', 'Resource allocation', 'What-if scenario results'],
    whyItMatters: [
      'Automates scenario generation that previously took planners hours',
      'Reduces overtime costs by ~18% through smarter shift allocation',
    ],
  },
];

// ── Deviation Log ────────────────────────────────────────────────
export interface Deviation {
  id: string;
  ts: string;
  lineId: string;
  stationId?: string;
  plannedUnits: number;
  actualUnits: number;
  gapPct: number;
  reasonCode: string;
  actionTaken: string;
  resolved: boolean;
  severity: 'high' | 'med' | 'low';
}

const reasonCodes = ['Unplanned downtime', 'Material shortage', 'Quality hold', 'Changeover delay', 'Operator absence', 'Tool breakage'];
const actions = ['Rescheduled shift', 'Added overtime', 'Rerouted to backup station', 'Expedited material', 'Adjusted target', 'Escalated to maintenance'];

export const makeDeviationLog = (): Deviation[] => {
  const deviations: Deviation[] = [];
  const now = Date.now();
  for (let i = 0; i < 20; i++) {
    const planned = 120 + Math.floor(Math.random() * 80);
    const gap = 2 + Math.floor(Math.random() * 18);
    const actual = Math.round(planned * (1 - gap / 100));
    deviations.push({
      id: `DEV_${2000 + i}`,
      ts: new Date(now - i * 3600_000).toISOString(),
      lineId: lines[i % 3],
      stationId: i % 3 === 0 ? undefined : stationsByLine[lines[i % 3]][i % 5]?.stationId,
      plannedUnits: planned,
      actualUnits: actual,
      gapPct: gap,
      reasonCode: reasonCodes[i % reasonCodes.length],
      actionTaken: actions[i % actions.length],
      resolved: i > 5,
      severity: gap > 12 ? 'high' : gap > 6 ? 'med' : 'low',
    });
  }
  return deviations;
};

// ── KPI Impact ───────────────────────────────────────────────────
export interface KpiBeforeAfter {
  category: string;
  kpi: string;
  before: string;
  after: string;
  improvement: string;
}

export const kpiImpact: KpiBeforeAfter[] = [
  // Downtime & Availability
  { category: 'Downtime & Availability', kpi: 'Availability', before: '82%', after: '88%', improvement: '+6 pp' },
  { category: 'Downtime & Availability', kpi: 'Avg Downtime / Shift', before: '140 min', after: '95 min', improvement: '−32%' },
  { category: 'Downtime & Availability', kpi: 'MTBF', before: '120 hrs', after: '165 hrs', improvement: '+37%' },
  { category: 'Downtime & Availability', kpi: 'MTTR', before: '40 min', after: '28 min', improvement: '−30%' },
  // Cycle Time & Performance
  { category: 'Cycle Time & Performance', kpi: 'Avg Cycle Time', before: '62 sec', after: '58 sec', improvement: '−6.5%' },
  { category: 'Cycle Time & Performance', kpi: 'Cycle Time Variance', before: '18%', after: '11%', improvement: '−7 pp' },
  { category: 'Cycle Time & Performance', kpi: 'OEE', before: '65%', after: '74%', improvement: '+9 pp' },
  // Capacity & Output
  { category: 'Capacity & Output', kpi: 'Daily Output', before: '1,080 units', after: '1,210 units', improvement: '+12%' },
  { category: 'Capacity & Output', kpi: 'Planned vs Actual Gap', before: '12%', after: '4%', improvement: '−8 pp' },
  { category: 'Capacity & Output', kpi: 'Utilization', before: '71%', after: '82%', improvement: '+11 pp' },
  // Bottleneck & Flow
  { category: 'Bottleneck & Flow', kpi: 'Chronic Bottleneck Stations', before: '3 per line', after: '1 per line', improvement: '−67%' },
  { category: 'Bottleneck & Flow', kpi: 'WIP Accumulation Events', before: '12 / week', after: '4 / week', improvement: '−67%' },
  // Cost, Delivery & Planning
  { category: 'Cost, Delivery & Planning', kpi: 'Overtime Cost', before: '$48K / mo', after: '$39K / mo', improvement: '−18%' },
  { category: 'Cost, Delivery & Planning', kpi: 'On-Time Delivery', before: '88%', after: '95%', improvement: '+7 pp' },
  { category: 'Cost, Delivery & Planning', kpi: 'Planning Cycle Time', before: '4 hrs', after: '45 min', improvement: '−81%' },
];

export interface KpiMapping {
  aiModel: string;
  keyKpis: string[];
  businessValue: string;
}

export const kpiMapping: KpiMapping[] = [
  { aiModel: 'Downtime Forecasting', keyKpis: ['Availability', 'MTBF', 'MTTR', 'Downtime/Shift'], businessValue: 'Proactive maintenance reduces unplanned stoppages by 32%' },
  { aiModel: 'Cycle Time Variability', keyKpis: ['Avg Cycle Time', 'Variance', 'OEE'], businessValue: 'Standardized performance improves throughput by 6.5%' },
  { aiModel: 'Capacity Prediction', keyKpis: ['Daily Output', 'Utilization', 'Planned vs Actual Gap'], businessValue: 'Accurate forecasts close the plan-actual gap from 12% to 4%' },
  { aiModel: 'Bottleneck Detection', keyKpis: ['Chronic Bottlenecks', 'WIP Events'], businessValue: 'Real-time ranking eliminates 67% of chronic constraints' },
  { aiModel: 'Plan Optimization', keyKpis: ['Overtime Cost', 'On-Time Delivery', 'Planning Cycle Time'], businessValue: 'Automated optimization saves $9K/mo and cuts planning time 81%' },
];

// ── Extended KB Snippets ─────────────────────────────────────────
export const extendedKbSnippets = [
  ...existingSnippets,
  { topic: 'Effective Cycle Time', content: 'Effective cycle time accounts for variance and micro-stoppages: ECT = mean cycle time × (1 + variance%). It represents the realistic throughput rate of a station.' },
  { topic: 'Downtime Forecast Value', content: 'Forecasting downtime 2–4 hours ahead enables proactive maintenance scheduling, reducing unplanned stoppages by up to 32% and improving availability by 6 percentage points.' },
  { topic: 'Bottleneck Threshold', content: 'A station is flagged as a bottleneck when its effective cycle time exceeds the line takt time by more than 10%, causing WIP accumulation upstream.' },
  { topic: 'Availability Calculation', content: 'Availability = (Planned Production Time − Downtime) / Planned Production Time. It is one of the three OEE factors alongside Performance and Quality.' },
  { topic: 'OEE Definition', content: 'Overall Equipment Effectiveness (OEE) = Availability × Performance × Quality. World-class OEE is 85%+. Most plants operate between 60–75%.' },
  { topic: 'Drift Detection', content: 'Model drift occurs when input data distributions shift over time. Monitoring drift ensures predictions stay accurate. High drift triggers automatic model retraining.' },
];
