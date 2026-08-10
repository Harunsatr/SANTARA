/**
 * WHO Anthro Plus Nutritional Status Standards & Visual Token Resolvers
 * 
 * WHO Classification for Adolescents (5-19 years):
 * - Severely Thinness: < -3 SD
 * - Thinness: -3 SD to < -2 SD
 * - Normal: -2 SD to +1 SD
 * - Overweight: > +1 SD to +2 SD
 * - Obese: > +2 SD
 */

import { NutritionStatusCategory } from '@/types/models';

export interface NutritionCategoryStyle {
  label: string;
  category: NutritionStatusCategory;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  badgeClass: string;
  description: string;
  zScoreRange: string;
}

export const NUTRITION_STYLES: Record<NutritionStatusCategory, NutritionCategoryStyle> = {
  'Severely Thinness': {
    label: 'Gizi Buruk (Sangat Kurus)',
    category: 'Severely Thinness',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    borderColor: '#ddd6fe',
    textColor: '#6d28d9',
    badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'Indeks Massa Tubuh berada di bawah batas standar deviasi -3 SD.',
    zScoreRange: '< -3 SD',
  },
  'Thinness': {
    label: 'Kurus (Gizi Kurang)',
    category: 'Thinness',
    color: '#0284c7',
    bgColor: '#e0f2fe',
    borderColor: '#bae6fd',
    textColor: '#0369a1',
    badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
    description: 'Indeks Massa Tubuh berada di antara -3 SD s.d. < -2 SD.',
    zScoreRange: '-3 SD s.d. < -2 SD',
  },
  'Normal': {
    label: 'Gizi Baik (Normal)',
    category: 'Normal',
    color: '#10b981',
    bgColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    textColor: '#047857',
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    description: 'Indeks Massa Tubuh berada pada rentang ideal (-2 SD s.d. +1 SD).',
    zScoreRange: '-2 SD s.d. +1 SD',
  },
  'Overweight': {
    label: 'Gizi Lebih (Overweight)',
    category: 'Overweight',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    borderColor: '#fde68a',
    textColor: '#b45309',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    description: 'Indeks Massa Tubuh berada di atas normal (> +1 SD s.d. +2 SD).',
    zScoreRange: '> +1 SD s.d. +2 SD',
  },
  'Obese': {
    label: 'Obesitas (Obese)',
    category: 'Obese',
    color: '#ef4444',
    bgColor: '#fef2f2',
    borderColor: '#fecaca',
    textColor: '#b91c1c',
    badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
    description: 'Indeks Massa Tubuh berada pada tingkat kegemukan berat (> +2 SD).',
    zScoreRange: '> +2 SD',
  },
  'UNKNOWN': {
    label: 'Belum Terklasifikasi',
    category: 'UNKNOWN',
    color: '#64748b',
    bgColor: '#f8fafc',
    borderColor: '#e2e8f0',
    textColor: '#475569',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
    description: 'Status gizi belum ditentukan atau memerlukan data referensi umur/kelamin.',
    zScoreRange: '-',
  },
};

/**
 * Normalizes any raw nutritional status string from backend to canonical category.
 */
export function normalizeNutritionStatus(rawStatus?: string | null): NutritionStatusCategory {
  if (!rawStatus || typeof rawStatus !== 'string') return 'UNKNOWN';

  const cleaned = rawStatus.trim().toLowerCase();

  if (cleaned.includes('severely') || cleaned.includes('sangat kurus') || cleaned.includes('gizi buruk')) {
    return 'Severely Thinness';
  }
  if (cleaned.includes('thinness') || cleaned.includes('kurus') || cleaned.includes('gizi kurang')) {
    return 'Thinness';
  }
  if (cleaned.includes('obese') || cleaned.includes('obesitas')) {
    return 'Obese';
  }
  if (cleaned.includes('overweight') || cleaned.includes('gizi lebih') || cleaned.includes('gemuk')) {
    return 'Overweight';
  }
  if (cleaned.includes('normal') || cleaned.includes('gizi baik') || cleaned.includes('ideal')) {
    return 'Normal';
  }

  return 'UNKNOWN';
}

/**
 * Gets styling and metadata for a given status string.
 */
export function getNutritionStyle(rawStatus?: string | null): NutritionCategoryStyle {
  const category = normalizeNutritionStatus(rawStatus);
  return NUTRITION_STYLES[category] || NUTRITION_STYLES.UNKNOWN;
}
