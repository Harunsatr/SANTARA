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
    total: examinations.length,
  };

  examinations.forEach(exam => {
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
  // Map latest examination per student
  const latestExamByStudent = new Map<string, Examination>();
  examinations.forEach(exam => {
    const existing = latestExamByStudent.get(exam.student_id);
    if (!existing || new Date(exam.examination_date) > new Date(existing.examination_date)) {
      latestExamByStudent.set(exam.student_id, exam);
    }
  });

  return classes.map(cls => {
    const classStudents = students.filter(s => s.class_id === cls.id);
    const classExams: Examination[] = [];

    classStudents.forEach(st => {
      const ex = latestExamByStudent.get(st.id);
      if (ex) classExams.push(ex);
    });

    const dist = calculateNutritionDistribution(classExams);

    return {
      classId: cls.id,
      className: cls.class_name ? `Kelas ${cls.grade || ''} ${cls.class_name}`.trim() : `Kelas ${cls.id}`,
      grade: cls.grade || '10',
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
  const totalTarget = ttdRecords.length;
  let consumedCount = 0;
  const byClass: Record<string, { total: number; consumed: number; percentage: number }> = {};

  ttdRecords.forEach(rec => {
    const isConsumed =
      rec.consumed === true ||
      String(rec.consumed).toLowerCase() === 'sudah' ||
      String(rec.consumed).toLowerCase() === 'true';

    if (isConsumed) {
      consumedCount++;
    }

    const clsId = rec.class_id || 'UNKNOWN';
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
    totalStudents: students.length,
    totalExaminations: examinations.length,
    totalScreenings: screenings.length,
    totalTTDLogs: ttdRecords.length,
    nutritionDistribution: dist,
    atRiskCount,
    ttdComplianceRate: ttd.percentage,
  };
}
