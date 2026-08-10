/**
 * UI State and Component Types for Santara Frontend
 */

export type LoadingStatus = 'idle' | 'loading' | 'refreshing' | 'success' | 'error';

export interface UIState<T> {
  status: LoadingStatus;
  data: T | null;
  error: string | null;
  message?: string | null;
}

export interface NutritionDistribution {
  severelyThinness: number;
  thinness: number;
  normal: number;
  overweight: number;
  obese: number;
  unknown: number;
  total: number;
}

export interface ClassNutritionSummary {
  classId: string;
  className: string;
  grade: string | number;
  totalStudents: number;
  examinedCount: number;
  distribution: NutritionDistribution;
}

export interface TtdComplianceSummary {
  totalTarget: number;
  consumedCount: number;
  percentage: number;
  byClass: Record<string, { total: number; consumed: number; percentage: number }>;
}

export interface SchoolAnalyticsOverview {
  totalStudents: number;
  totalExaminations: number;
  totalScreenings: number;
  totalTTDLogs: number;
  nutritionDistribution: NutritionDistribution;
  atRiskCount: number;
  ttdComplianceRate: number;
}
