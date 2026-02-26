import type { Plan, Station, Adjustments } from './sampleData';

export interface PredictionResult {
  predictedCapacityUnits: number;
  confidence: number;
  drivers: { name: string; impactPct: number }[];
}

export interface ValidationResult {
  feasible: boolean;
  overloadPct?: number;
  idlePct?: number;
  warnings: string[];
}

export interface BottleneckResult {
  stationId: string;
  stationName: string;
  rank: number;
  reason: string;
  effectiveCycleTime: number;
  impactPct: number;
}

export interface SimulationResult {
  utilizationDelta: number;
  overloadDelta: number;
  bottleneckCountDelta: number;
  feasibleAfter: boolean;
}

function effectiveCycleTime(s: Station): number {
  return s.meanCycleTimeSec * (1 + s.variancePct / 100) * (1 + s.scrapPct / 100);
}

function availableTimeSec(plan: Plan, stations: Station[]): number {
  const avgDowntime = stations.reduce((sum, s) => sum + s.downtimeMinPerShift, 0) / stations.length;
  return plan.workingHours * 3600 * plan.shifts - avgDowntime * 60 * plan.shifts;
}

export function predictCapacity(plan: Plan, stations: Station[]): PredictionResult {
  const bottleneck = stations.reduce((worst, s) => effectiveCycleTime(s) > effectiveCycleTime(worst) ? s : worst, stations[0]);
  const ect = effectiveCycleTime(bottleneck);
  const avail = availableTimeSec(plan, stations);
  const predicted = Math.floor(avail / ect);

  const totalVariance = stations.reduce((s, st) => s + st.variancePct, 0) / stations.length;
  const totalDowntime = stations.reduce((s, st) => s + st.downtimeMinPerShift, 0) / stations.length;
  const totalScrap = stations.reduce((s, st) => s + st.scrapPct, 0) / stations.length;
  const total = totalVariance + totalDowntime + totalScrap;

  const confidence = Math.max(0.60, Math.min(0.92, 0.92 - (totalVariance / 100) * 0.15 - (totalDowntime / 60) * 0.1));

  return {
    predictedCapacityUnits: predicted,
    confidence: Math.round(confidence * 100) / 100,
    drivers: [
      { name: 'Downtime', impactPct: Math.round((totalDowntime / total) * 100) },
      { name: 'Variance', impactPct: Math.round((totalVariance / total) * 100) },
      { name: 'Scrap', impactPct: Math.round((totalScrap / total) * 100) },
    ],
  };
}

export function validatePlan(plan: Plan, predictedCapacity: number): ValidationResult {
  const warnings: string[] = [];
  const feasible = predictedCapacity >= plan.plannedUnits;

  let overloadPct: number | undefined;
  let idlePct: number | undefined;

  if (feasible) {
    idlePct = Math.round(((predictedCapacity - plan.plannedUnits) / predictedCapacity) * 100);
    if (idlePct > 20) warnings.push('High idle capacity — consider reducing shifts');
    if (idlePct > 30) warnings.push('Significant overcapacity — cost inefficiency risk');
  } else {
    overloadPct = Math.round(((plan.plannedUnits - predictedCapacity) / predictedCapacity) * 100);
    warnings.push(`Overload: need ${plan.plannedUnits - predictedCapacity} more units capacity`);
    if (overloadPct > 15) warnings.push('Critical overload — add shift or reduce target');
  }

  if (plan.shifts >= 3) warnings.push('Max shifts reached — limited flexibility');
  if (plan.workingHours >= 11) warnings.push('Extended hours — fatigue risk');

  return { feasible, overloadPct, idlePct, warnings };
}

export function rankBottlenecks(stations: Station[]): BottleneckResult[] {
  const ranked = stations
    .map((s) => {
      const ect = effectiveCycleTime(s);
      let reason = 'Cycle time variance';
      if (s.downtimeMinPerShift > 10) reason = 'Downtime spikes';
      else if (s.scrapPct > 3) reason = 'Scrap loss';
      else if (s.variancePct > 15) reason = 'Cycle time variance';
      return { stationId: s.stationId, stationName: s.stationName, effectiveCycleTime: ect, reason, impactPct: 0, rank: 0 };
    })
    .sort((a, b) => b.effectiveCycleTime - a.effectiveCycleTime);

  const maxEct = ranked[0]?.effectiveCycleTime ?? 1;
  return ranked.slice(0, 5).map((r, i) => ({
    ...r,
    rank: i + 1,
    impactPct: Math.round((r.effectiveCycleTime / maxEct) * 100),
  }));
}

export function simulateScenario(plan: Plan, stations: Station[], adjustments: Adjustments): SimulationResult {
  const baseCapacity = predictCapacity(plan, stations);
  const baseValidation = validatePlan(plan, baseCapacity.predictedCapacityUnits);
  const baseBottlenecks = rankBottlenecks(stations).length;

  const adjustedPlan: Plan = {
    ...plan,
    shifts: Math.max(1, Math.min(3, plan.shifts + adjustments.shiftDelta)),
    workingHours: Math.max(6, Math.min(12, plan.workingHours + adjustments.workingHoursDelta)),
  };

  const adjustedStations = stations.map((s) => ({
    ...s,
    downtimeMinPerShift: Math.max(0, s.downtimeMinPerShift * (1 + adjustments.downtimeDeltaPct / 100)),
    scrapPct: Math.max(0, s.scrapPct * (1 + adjustments.scrapDeltaPct / 100)),
  }));

  const newCapacity = predictCapacity(adjustedPlan, adjustedStations);
  const newValidation = validatePlan(adjustedPlan, newCapacity.predictedCapacityUnits);
  const newBottlenecks = rankBottlenecks(adjustedStations).length;

  const baseUtil = baseCapacity.predictedCapacityUnits / plan.plannedUnits;
  const newUtil = newCapacity.predictedCapacityUnits / adjustedPlan.plannedUnits;

  return {
    utilizationDelta: Math.round((newUtil - baseUtil) * 100),
    overloadDelta: (newValidation.overloadPct ?? 0) - (baseValidation.overloadPct ?? 0),
    bottleneckCountDelta: newBottlenecks - baseBottlenecks,
    feasibleAfter: newValidation.feasible,
  };
}
