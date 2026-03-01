import * as XLSX from 'xlsx';
import type { UploadContext, PlanRowLong, UploadMeta, UploadAggregates } from '@/types/upload';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function generateUploadId(): string {
  return `upload_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function isDateColumn(header: string): boolean {
  return DATE_REGEX.test(header.trim());
}

function detectMetadataColumns(headers: string[]): string[] {
  return headers.filter((h) => !isDateColumn(h));
}

function detectDateColumns(headers: string[]): string[] {
  return headers.filter((h) => isDateColumn(h)).sort();
}

export interface ParseError {
  type: 'no_sheets' | 'no_headers' | 'no_date_columns' | 'no_data_rows' | 'parse_error';
  message: string;
}

export type ParseResult =
  | { success: true; context: UploadContext }
  | { success: false; error: ParseError };

export async function parsePlanUpload(file: File): Promise<ParseResult> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    if (!workbook.SheetNames.length) {
      return { success: false, error: { type: 'no_sheets', message: 'The uploaded file contains no sheets.' } };
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

    if (!jsonData.length) {
      return {
        success: false,
        error: { type: 'no_headers', message: 'The sheet appears to be empty. Please ensure it has headers and data rows.' },
      };
    }

    const headers = Object.keys(jsonData[0]);
    const dateColumns = detectDateColumns(headers);
    const metaColumns = detectMetadataColumns(headers);

    if (!dateColumns.length) {
      return {
        success: false,
        error: {
          type: 'no_date_columns',
          message: 'No date columns found. Date columns must be in YYYY-MM-DD format (e.g., 2026-03-01).',
        },
      };
    }

    const uploadId = generateUploadId();
    const rows: PlanRowLong[] = [];
    const lineSet = new Set<string>();

    for (const row of jsonData) {
      const plant = row['Plant'] as string | undefined;
      const line = (row['Line'] || row['line'] || row['LINE'] || row['LineId'] || row['line_id']) as string | undefined;
      const vcNo = row['VC No'] as string | undefined;
      const buildCardNumber = row['Build Card Number'] as string | undefined;
      const colourCode = row['Colour Code'] as string | undefined;
      const evrNumber = row['EVR Number'] as string | undefined;

      if (line) lineSet.add(line);

      for (const dateCol of dateColumns) {
        const rawValue = row[dateCol];
        const numericValue = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue));

        if (!isNaN(numericValue) && numericValue > 0) {
          rows.push({
            uploadId,
            plant: plant || undefined,
            line: line || undefined,
            vcNo: vcNo || undefined,
            buildCardNumber: buildCardNumber || undefined,
            colourCode: colourCode || undefined,
            evrNumber: evrNumber || undefined,
            planDate: dateCol.trim(),
            plannedUnits: Math.round(numericValue),
            raw: { ...row },
          });
        }
      }
    }

    if (!rows.length) {
      return {
        success: false,
        error: {
          type: 'no_data_rows',
          message: 'No plan rows found. Please fill in daily quantities in the date columns.',
        },
      };
    }

    const aggregates = buildAggregates(rows);

    const meta: UploadMeta = {
      uploadId,
      filename: file.name,
      createdAt: new Date().toISOString(),
      lineIds: Array.from(lineSet),
      dateStart: dateColumns[0],
      dateEnd: dateColumns[dateColumns.length - 1],
      rowCount: rows.length,
    };

    return {
      success: true,
      context: { meta, rows, aggregates },
    };
  } catch (e) {
    return {
      success: false,
      error: {
        type: 'parse_error',
        message: `Failed to parse the file: ${e instanceof Error ? e.message : 'Unknown error'}`,
      },
    };
  }
}

function buildAggregates(rows: PlanRowLong[]): UploadAggregates {
  let plannedUnitsTotal = 0;
  const plannedUnitsByLine: Record<string, number> = {};
  const plannedUnitsByDay: Record<string, number> = {};
  const plannedUnitsByLineDay: Record<string, Record<string, number>> = {};

  for (const row of rows) {
    plannedUnitsTotal += row.plannedUnits;

    const lineKey = row.line || 'Unknown';
    plannedUnitsByLine[lineKey] = (plannedUnitsByLine[lineKey] || 0) + row.plannedUnits;
    plannedUnitsByDay[row.planDate] = (plannedUnitsByDay[row.planDate] || 0) + row.plannedUnits;

    if (!plannedUnitsByLineDay[lineKey]) plannedUnitsByLineDay[lineKey] = {};
    plannedUnitsByLineDay[lineKey][row.planDate] =
      (plannedUnitsByLineDay[lineKey][row.planDate] || 0) + row.plannedUnits;
  }

  return { plannedUnitsTotal, plannedUnitsByLine, plannedUnitsByDay, plannedUnitsByLineDay };
}
