import type { UploadContext } from '@/types/upload';
import { getMeasuredBaselineForLines, type DailyMeasuredCapacity } from './measuredBaseline';
import { stationsByLine } from './sampleData';
import { predictCapacity, validatePlan, rankBottlenecks } from './mockEngine';
import type { Plan } from './sampleData';

export interface DashboardSummary {
  plannedUnitsTotal: number;
  predictedCapacity: number;
  capacityConfidence: number;
  capacityDrivers: { name: string; impactPct: number }[];
  feasible: boolean;
  overloadPct: number;
  idlePct: number;
  warnings: string[];
  topBottleneck: string;
  bottleneckCount: number;
  gapUnits: number;
  gapPct: number;
  dateRange: string;
  lineCount: number;
}

export interface DeviationLogEntry {
  date: string;
  lineId: string;
  plannedUnits: number;
  measuredUnits: number;
  gap: number;
  gapPct: number;
}

export interface ScenarioBaseline {
  plan: Plan;
  lineId: string;
}

export function buildDashboardSummary(uploadCtx: UploadContext): DashboardSummary {
  const { meta, aggregates } = uploadCtx;
  const primaryLine = meta.lineIds[0] || 'LINE_A';

  const stationLineKey = Object.keys(stationsByLine).find(
    (k) => k === primaryLine || k === primaryLine.toUpperCase().replace(' ', '_')
  ) || 'LINE_A';

  const stations = stationsByLine[stationLineKey] || stationsByLine['LINE_A'];
  const dates = Object.keys(aggregates.plannedUnitsByDay).sort();
  const dayCount = dates.length || 1;

  const dailyPlanned = aggregates.plannedUnitsTotal / dayCount;

  const syntheticPlan: Plan = {
    id: `UPLOAD_${meta.uploadId}`,
    lineId: stationLineKey,
    workingHours: 8,
    shifts: 2,
    plannedUnits: Math.round(dailyPlanned),
    taktTimeSec: dailyPlanned > 0 ? Math.round((8 * 3600 * 2) / dailyPlanned) : 30,
    startDate: meta.dateStart || dates[0] || '',
    endDate: meta.dateEnd || dates[dates.length - 1] || '',
  };

  const prediction = predictCapacity(syntheticPlan, stations);
  const validation = validatePlan(syntheticPlan, prediction.predictedCapacityUnits);
  const bottlenecks = rankBottlenecks(stations);

  const measuredBaseline = getMeasuredBaselineForLines(
    [stationLineKey],
    dates,
    syntheticPlan.workingHours,
    syntheticPlan.shifts
  );

  const measuredTotal = (measuredBaseline[stationLineKey] || []).reduce(
    (sum, d) => sum + d.measuredUnits, 0
  );

  const gapUnits = aggregates.plannedUnitsTotal - measuredTotal;
  const gapPct = measuredTotal > 0 ? Math.round((gapUnits / measuredTotal) * 100) : 0;

  return {
    plannedUnitsTotal: aggregates.plannedUnitsTotal,
    predictedCapacity: prediction.predictedCapacityUnits * dayCount,
    capacityConfidence: prediction.confidence,
    capacityDrivers: prediction.drivers,
    feasible: validation.feasible,
    overloadPct: validation.overloadPct || 0,
    idlePct: validation.idlePct || 0,
    warnings: validation.warnings,
    topBottleneck: bottlenecks[0]?.stationName || 'None',
    bottleneckCount: bottlenecks.length,
    gapUnits,
    gapPct,
    dateRange: `${meta.dateStart || '?'} → ${meta.dateEnd || '?'}`,
    lineCount: meta.lineIds.length || 1,
  };
}

export function buildDeviationLog(uploadCtx: UploadContext): DeviationLogEntry[] {
  const { meta, aggregates } = uploadCtx;
  const entries: DeviationLogEntry[] = [];

  for (const lineId of meta.lineIds.length > 0 ? meta.lineIds : ['LINE_A']) {
    const stationLineKey = Object.keys(stationsByLine).find(
      (k) => k === lineId || k === lineId.toUpperCase().replace(' ', '_')
    ) || lineId;

    const dates = Object.keys(aggregates.plannedUnitsByDay).sort();
    const measured = getMeasuredBaselineForLines([stationLineKey], dates);
    const measuredMap = new Map<string, number>();

    for (const m of measured[stationLineKey] || []) {
      measuredMap.set(m.date, m.measuredUnits);
    }

    for (const date of dates) {
      const lineDay = aggregates.plannedUnitsByLineDay[lineId];
      const planned = lineDay?.[date] || aggregates.plannedUnitsByDay[date] || 0;
      const meas = measuredMap.get(date) || 0;
      const gap = planned - meas;
      const gapPct = meas > 0 ? Math.round((gap / meas) * 100) : 0;

      entries.push({ date, lineId, plannedUnits: planned, measuredUnits: meas, gap, gapPct });
    }
  }

  return entries;
}

export function buildScenarioBaseline(uploadCtx: UploadContext): ScenarioBaseline {
  const { meta, aggregates } = uploadCtx;
  const primaryLine = meta.lineIds[0] || 'LINE_A';
  const stationLineKey = Object.keys(stationsByLine).find(
    (k) => k === primaryLine || k === primaryLine.toUpperCase().replace(' ', '_')
  ) || 'LINE_A';

  const dates = Object.keys(aggregates.plannedUnitsByDay).sort();
  const dayCount = dates.length || 1;
  const dailyPlanned = aggregates.plannedUnitsTotal / dayCount;

  return {
    plan: {
      id: `UPLOAD_${meta.uploadId}`,
      lineId: stationLineKey,
      workingHours: 8,
      shifts: 2,
      plannedUnits: Math.round(dailyPlanned),
      taktTimeSec: dailyPlanned > 0 ? Math.round((8 * 3600 * 2) / dailyPlanned) : 30,
      startDate: meta.dateStart || '',
      endDate: meta.dateEnd || '',
    },
    lineId: stationLineKey,
  };
}
