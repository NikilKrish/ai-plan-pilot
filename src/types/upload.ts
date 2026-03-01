export type UploadId = string;

export interface UploadMeta {
  uploadId: UploadId;
  filename: string;
  createdAt: string;
  plant?: string;
  lineIds: string[];
  dateStart?: string;
  dateEnd?: string;
  rowCount: number;
}

export interface PlanRowLong {
  uploadId: UploadId;
  plant?: string;
  line?: string;
  vcNo?: string;
  buildCardNumber?: string;
  colourCode?: string;
  evrNumber?: string;
  planDate: string;
  plannedUnits: number;
  raw: Record<string, unknown>;
}

export interface UploadAggregates {
  plannedUnitsTotal: number;
  plannedUnitsByLine: Record<string, number>;
  plannedUnitsByDay: Record<string, number>;
  plannedUnitsByLineDay: Record<string, Record<string, number>>;
}

export interface UploadContext {
  meta: UploadMeta;
  rows: PlanRowLong[];
  aggregates: UploadAggregates;
}
