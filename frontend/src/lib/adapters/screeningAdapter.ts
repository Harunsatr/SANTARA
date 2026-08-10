/**
 * Screening Compatibility Adapter
 * Formats clinical inputs (Hb, Blood Pressure) into backend generic `result` strings
 * and extracts them cleanly for UI presentation.
 */

import { Screening } from '@/types/models';

/**
 * Formats Hemoglobin input into standard result string.
 */
export function formatHbResult(hbValue: number | string, category?: string): string {
  const numVal = typeof hbValue === 'number' ? hbValue : parseFloat(String(hbValue).replace(',', '.'));
  if (isNaN(numVal)) {
    return String(hbValue).trim();
  }
  const statusSuffix = category ? ` (${category})` : '';
  return `Hb ${numVal} g/dL${statusSuffix}`;
}

/**
 * Formats Blood Pressure input (Systolic / Diastolic) into standard result string.
 */
export function formatBloodPressureResult(
  systolic: number | string,
  diastolic: number | string,
  category?: string
): string {
  const statusSuffix = category ? ` (${category})` : '';
  return `${systolic}/${diastolic} mmHg${statusSuffix}`;
}

/**
 * Parses raw `result` string into structured values if present.
 */
export function parseScreeningResult(screening: Screening): {
  hbValue?: number;
  systolic?: number;
  diastolic?: number;
  cleanResult: string;
} {
  const raw = screening.result || '';

  // Check for Hb format: "Hb 12.5 g/dL"
  const hbMatch = raw.match(/Hb\s*([\d.,]+)\s*g\/dL/i);
  if (hbMatch && hbMatch[1]) {
    const parsed = parseFloat(hbMatch[1].replace(',', '.'));
    return {
      hbValue: isNaN(parsed) ? undefined : parsed,
      cleanResult: raw,
    };
  }

  // Check for Blood Pressure format: "120/80 mmHg"
  const bpMatch = raw.match(/(\d{2,3})\s*\/\s*(\d{2,3})\s*mmHg/i);
  if (bpMatch && bpMatch[1] && bpMatch[2]) {
    return {
      systolic: parseInt(bpMatch[1], 10),
      diastolic: parseInt(bpMatch[2], 10),
      cleanResult: raw,
    };
  }

  return {
    cleanResult: raw,
  };
}
