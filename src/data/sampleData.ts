export interface Line {
  lineId: string;
  name: string;
}

export interface Station {
  stationId: string;
  stationName: string;
  lineId: string;
  meanCycleTimeSec: number;
  variancePct: number;
  downtimeMinPerShift: number;
  scrapPct: number;
}

export interface Plan {
  id: string;
  lineId: string;
  workingHours: number;
  shifts: number;
  plannedUnits: number;
  taktTimeSec: number;
  startDate: string;
  endDate: string;
}

export interface ScenarioRecord {
  id: string;
  timestamp: string;
  lineId: string;
  adjustments: Adjustments;
  result: {
    utilizationDelta: number;
    overloadDelta: number;
    bottleneckCountDelta: number;
    feasibleAfter: boolean;
  };
}

export interface Adjustments {
  shiftDelta: number;
  workingHoursDelta: number;
  downtimeDeltaPct: number;
  scrapDeltaPct: number;
}

export const lines: Line[] = [
  { lineId: 'LINE_A', name: 'Line A' },
  { lineId: 'LINE_B', name: 'Line B' },
  { lineId: 'LINE_C', name: 'Line C' },
];

const makeStations = (lineId: string, prefix: string): Station[] => [
  { stationId: `${prefix}01`, stationName: `${prefix}-Intake`, lineId, meanCycleTimeSec: 12, variancePct: 8, downtimeMinPerShift: 5, scrapPct: 1.2 },
  { stationId: `${prefix}02`, stationName: `${prefix}-Prep`, lineId, meanCycleTimeSec: 15, variancePct: 12, downtimeMinPerShift: 8, scrapPct: 2.1 },
  { stationId: `${prefix}03`, stationName: `${prefix}-Assembly`, lineId, meanCycleTimeSec: 22, variancePct: 18, downtimeMinPerShift: 12, scrapPct: 3.5 },
  { stationId: `${prefix}04`, stationName: `${prefix}-Weld`, lineId, meanCycleTimeSec: 18, variancePct: 15, downtimeMinPerShift: 14, scrapPct: 2.8 },
  { stationId: `${prefix}05`, stationName: `${prefix}-Paint`, lineId, meanCycleTimeSec: 20, variancePct: 10, downtimeMinPerShift: 6, scrapPct: 1.5 },
  { stationId: `${prefix}06`, stationName: `${prefix}-Cure`, lineId, meanCycleTimeSec: 25, variancePct: 5, downtimeMinPerShift: 3, scrapPct: 0.8 },
  { stationId: `${prefix}07`, stationName: `${prefix}-QC`, lineId, meanCycleTimeSec: 10, variancePct: 20, downtimeMinPerShift: 10, scrapPct: 4.2 },
  { stationId: `${prefix}08`, stationName: `${prefix}-Pack`, lineId, meanCycleTimeSec: 8, variancePct: 6, downtimeMinPerShift: 4, scrapPct: 0.5 },
  { stationId: `${prefix}09`, stationName: `${prefix}-Final`, lineId, meanCycleTimeSec: 14, variancePct: 11, downtimeMinPerShift: 7, scrapPct: 1.9 },
];

export const stationsByLine: Record<string, Station[]> = {
  LINE_A: makeStations('LINE_A', 'A'),
  LINE_B: makeStations('LINE_B', 'B'),
  LINE_C: makeStations('LINE_C', 'C'),
};

export const plans: Plan[] = [
  { id: 'PLAN_1', lineId: 'LINE_A', workingHours: 8, shifts: 2, plannedUnits: 1250, taktTimeSec: 23, startDate: '2026-03-01', endDate: '2026-03-31' },
  { id: 'PLAN_2', lineId: 'LINE_B', workingHours: 10, shifts: 1, plannedUnits: 980, taktTimeSec: 36, startDate: '2026-03-01', endDate: '2026-03-15' },
  { id: 'PLAN_3', lineId: 'LINE_C', workingHours: 12, shifts: 3, plannedUnits: 1500, taktTimeSec: 28, startDate: '2026-03-10', endDate: '2026-04-10' },
];

export const kbSnippets = [
  { topic: 'Cycle Time vs Takt Time', content: 'Cycle time is the actual time to complete one unit at a station. Takt time is the required pace to meet demand. When cycle time exceeds takt time, the station becomes a bottleneck.' },
  { topic: 'Bottleneck Definition', content: 'A bottleneck is the station with the highest effective cycle time in a line. It limits the throughput of the entire production line.' },
  { topic: 'Downtime Effects', content: 'Unplanned downtime reduces available production time. A 10-minute downtime per shift on a bottleneck station can reduce daily output by 3–8% depending on cycle time.' },
  { topic: 'Scrap Loss Impact', content: 'Scrap percentage directly reduces effective output. A 3% scrap rate means 3 out of every 100 units produced are wasted, requiring additional capacity to meet targets.' },
  { topic: 'Shift Optimization', content: 'Adding a shift increases available time proportionally but also increases labor cost. The optimal number of shifts depends on demand volume and station utilization rates.' },
  { topic: 'Variance Management', content: 'High cycle time variance indicates inconsistent station performance. Reducing variance through standardization can improve throughput by 5–15% without adding capacity.' },
];
