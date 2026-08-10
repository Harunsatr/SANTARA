/**
 * Examination Compatibility Adapter
 * Bridges UI requirements (LiLA / Lingkar Lengan Atas) with backend schema
 * without modifying the locked Google Sheets database.
 * 
 * LiLA format in notes: "LiLA: {value} cm | {notes}" or "LiLA: {value} cm"
 */

import { Examination, ExaminationWithLiLA } from '@/types/models';

const LILA_REGEX = /LiLA:\s*([\d.,]+)\s*cm/i;
const LILA_PREFIX_CLEAN = /^LiLA:\s*[\d.,]+\s*cm\s*(\||-)?\s*/i;

/**
 * Serializes user-inputted LiLA into the `notes` field string.
 */
export function serializeExaminationNotes(
  lilaCm?: number | null,
  customNotes?: string | null
): string {
  const cleanCustom = (customNotes || '').trim();

  if (lilaCm !== undefined && lilaCm !== null && !isNaN(Number(lilaCm)) && Number(lilaCm) > 0) {
    const formattedLiLA = `LiLA: ${Number(lilaCm)} cm`;
    if (cleanCustom) {
      return `${formattedLiLA} | ${cleanCustom}`;
    }
    return formattedLiLA;
  }

  return cleanCustom;
}

/**
 * Parses raw `notes` string from backend into structured LiLA and clean notes.
 */
export function parseExaminationNotes(rawNotes?: string | null): {
  lila_cm?: number;
  clean_notes: string;
} {
  if (!rawNotes || typeof rawNotes !== 'string') {
    return { clean_notes: '' };
  }

  const match = rawNotes.match(LILA_REGEX);
  if (match && match[1]) {
    const parsedNum = parseFloat(match[1].replace(',', '.'));
    const cleanNotes = rawNotes.replace(LILA_PREFIX_CLEAN, '').trim();
    return {
      lila_cm: isNaN(parsedNum) ? undefined : parsedNum,
      clean_notes: cleanNotes,
    };
  }

  return {
    clean_notes: rawNotes.trim(),
  };
}

/**
 * Adapts raw Examination from backend into ExaminationWithLiLA domain model.
 */
export function adaptExaminationFromApi(exam: Examination): ExaminationWithLiLA {
  const { lila_cm, clean_notes } = parseExaminationNotes(exam.notes);
  return {
    ...exam,
    lila_cm,
    clean_notes,
  };
}

/**
 * Adapts an array of raw Examinations from backend.
 */
export function adaptExaminationsFromApi(exams: Examination[]): ExaminationWithLiLA[] {
  return exams.map(adaptExaminationFromApi);
}
