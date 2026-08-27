/**
 * Health Analytics & Reusable Aggregation Utilities
 * Used by Public Charts and Kader Dashboard
 */

import {
  Student,
  Examination,
  Screening,
  TTDRecord,
  ClassRoom,
} from '@/types/models';
import {
  NutritionDistribution,
  ClassNutritionSummary,
  TtdComplianceSummary,
  SchoolAnalyticsOverview,
} from '@/types/ui';
import { normalizeNutritionStatus } from './nutrition';
import { calculatePercentage } from './number';
import { normalizeString, normalizeBoolean } from '@/lib/normalizers/dataNormalizer';

/**
 * Calculates nutritional distribution breakdown from examinations.
 */
export function calculateNutritionDistribution(
  examinations: Examination[] = []
): NutritionDistribution {
  const dist: NutritionDistribution = {
    severelyThinness: 0,
    thinness: 0,
    normal: 0,
    overweight: 0,
    obese: 0,
    unknown: 0,
    total: Array.isArray(examinations) ? examinations.length : 0,
  };

  if (!Array.isArray(examinations)) return dist;

  examinations.forEach(exam => {
    if (!exam) return;
    const cat = normalizeNutritionStatus(exam.nutrional_status);
    switch (cat) {
      case 'Severely Thinness':
        dist.severelyThinness++;
        break;
      case 'Thinness':
        dist.thinness++;
        break;
      case 'Normal':
        dist.normal++;
        break;
      case 'Overweight':
        dist.overweight++;
        break;
      case 'Obese':
        dist.obese++;
        break;
      default:
        dist.unknown++;
        break;
    }
  });

  return dist;
}

/**
 * Calculates class-level nutrition summaries for charts and tables.
 */
export function calculateClassNutritionSummaries(
  classes: ClassRoom[] = [],
  students: Student[] = [],
  examinations: Examination[] = []
): ClassNutritionSummary[] {
  if (!Array.isArray(classes)) return [];
  const safeStudents = Array.isArray(students) ? students : [];
  const safeExams = Array.isArray(examinations) ? examinations : [];

  // Map latest examination per student
  const latestExamByStudent = new Map<string, Examination>();
  safeExams.forEach(exam => {
    if (!exam) return;
    const studentId = normalizeString(exam.student_id);
    if (!studentId) return;

    const existing = latestExamByStudent.get(studentId);
    if (!existing || new Date(exam.examination_date) > new Date(existing.examination_date)) {
      latestExamByStudent.set(studentId, exam);
    }
  });

  return classes.map(cls => {
    const classId = normalizeString(cls?.id);
    const rawClassName = normalizeString(cls?.class_name);
    const rawGrade = normalizeString(cls?.grade);
    const gr = rawGrade || (/(\d+)/.exec(rawClassName)?.[1] || '10');
    const finalName = rawClassName || `Kelas ${gr}`;

    const classStudents = safeStudents.filter(s => normalizeString(s?.class_id) === classId);
    const classExams: Examination[] = [];

    classStudents.forEach(st => {
      const stId = normalizeString(st?.id);
      const ex = latestExamByStudent.get(stId);
      if (ex) classExams.push(ex);
    });

    const dist = calculateNutritionDistribution(classExams);

    return {
      classId,
      className: finalName,
      grade: gr,
      totalStudents: classStudents.length,
      examinedCount: classExams.length,
      distribution: dist,
    };
  });
}

/**
 * Calculates TTD compliance metrics.
 */
export function calculateTTDCompliance(
  ttdRecords: TTDRecord[] = []
): TtdComplianceSummary {
  if (!Array.isArray(ttdRecords)) {
    return {
      totalTarget: 0,
      consumedCount: 0,
      percentage: 0,
      byClass: {},
    };
  }

  const totalTarget = ttdRecords.length;
  let consumedCount = 0;
  const byClass: Record<string, { total: number; consumed: number; percentage: number }> = {};

  ttdRecords.forEach(rec => {
    if (!rec) return;
    const isConsumed = normalizeBoolean(rec.consumed, false);

    if (isConsumed) {
      consumedCount++;
    }

    const clsId = normalizeString(rec.class_id) || 'UNKNOWN';
    if (!byClass[clsId]) {
      byClass[clsId] = { total: 0, consumed: 0, percentage: 0 };
    }
    byClass[clsId].total++;
    if (isConsumed) {
      byClass[clsId].consumed++;
    }
  });

  // Calculate percentages per class
  Object.keys(byClass).forEach(clsId => {
    const item = byClass[clsId];
    item.percentage = calculatePercentage(item.consumed, item.total);
  });

  return {
    totalTarget,
    consumedCount,
    percentage: calculatePercentage(consumedCount, totalTarget),
    byClass,
  };
}

/**
 * Calculates school-wide analytics overview.
 */
export function calculateSchoolOverview(
  students: Student[] = [],
  examinations: Examination[] = [],
  screenings: Screening[] = [],
  ttdRecords: TTDRecord[] = []
): SchoolAnalyticsOverview {
  const dist = calculateNutritionDistribution(examinations);
  const ttd = calculateTTDCompliance(ttdRecords);

  // At-risk includes: Severely Thinness, Obese
  const atRiskCount = dist.severelyThinness + dist.obese;

  return {
    totalStudents: Array.isArray(students) ? students.length : 0,
    totalExaminations: Array.isArray(examinations) ? examinations.length : 0,
    totalScreenings: Array.isArray(screenings) ? screenings.length : 0,
    totalTTDLogs: Array.isArray(ttdRecords) ? ttdRecords.length : 0,
    nutritionDistribution: dist,
    atRiskCount,
    ttdComplianceRate: ttd.percentage,
  };
}
