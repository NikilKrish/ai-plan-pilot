import { stationsByLine, type Station } from './sampleData';

export interface DailyMeasuredCapacity {
  lineId: string;
  date: string;
  measuredUnits: number;
  avgCycleTimeSec: number;
  avgDowntimeMin: number;
  avgScrapPct: number;
}

function effectiveCycleTime(s: Station): number {
  return s.meanCycleTimeSec * (1 + s.variancePct / 100) * (1 + s.scrapPct / 100);
}

export function computeDailyMeasuredCapacity(
  lineId: string,
  dates: string[],
  workingHours: number = 8,
  shifts: number = 2
): DailyMeasuredCapacity[] {
  const stations = stationsByLine[lineId];
  if (!stations || stations.length === 0) return [];

  const bottleneck = stations.reduce((worst, s) =>
    effectiveCycleTime(s) > effectiveCycleTime(worst) ? s : worst, stations[0]);

  const ect = effectiveCycleTime(bottleneck);
  const avgDowntime = stations.reduce((sum, s) => sum + s.downtimeMinPerShift, 0) / stations.length;
  const availSec = workingHours * 3600 * shifts - avgDowntime * 60 * shifts;
  const baseCapacity = Math.floor(availSec / ect);

  const avgCycleTimeSec = stations.reduce((sum, s) => sum + s.meanCycleTimeSec, 0) / stations.length;
  const avgScrapPct = stations.reduce((sum, s) => sum + s.scrapPct, 0) / stations.length;

  return dates.map((date, i) => {
    const seed = hashStr(lineId + date);
    const jitter = 0.92 + (seed % 16) / 100;

    return {
      lineId,
      date,
      measuredUnits: Math.floor(baseCapacity * jitter),
      avgCycleTimeSec: Math.round(avgCycleTimeSec * 100) / 100,
      avgDowntimeMin: Math.round(avgDowntime * 100) / 100,
      avgScrapPct: Math.round(avgScrapPct * 100) / 100,
    };
  });
}

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getMeasuredBaselineForLines(
  lineIds: string[],
  dates: string[],
  workingHours?: number,
  shifts?: number
): Record<string, DailyMeasuredCapacity[]> {
  const result: Record<string, DailyMeasuredCapacity[]> = {};
  for (const lineId of lineIds) {
    const mapped = Object.keys(stationsByLine).find(
      (k) => k === lineId || k.replace('LINE_', 'Line ') === lineId || k === lineId.toUpperCase().replace(' ', '_')
    );
    if (mapped) {
      result[lineId] = computeDailyMeasuredCapacity(mapped, dates, workingHours, shifts);
    }
  }
  return result;
}
