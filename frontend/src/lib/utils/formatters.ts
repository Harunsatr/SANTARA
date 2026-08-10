/**
 * Text and Label Formatting Helpers
 */

import { Gender, StudentStatus } from '@/types/models';

export function formatGender(gender?: Gender | string): string {
  if (gender === 'L' || gender === 'l' || gender === 'Laki-laki') {
    return 'Laki-laki';
  }
  if (gender === 'P' || gender === 'p' || gender === 'Perempuan') {
    return 'Perempuan';
  }
  return gender || '-';
}

export function formatStudentStatus(status?: StudentStatus | string): {
  label: string;
  badgeClass: string;
} {
  if (status === 'active' || status === 'Aktif') {
    return {
      label: 'Aktif',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    };
  }
  return {
    label: 'Nonaktif / Arsip',
    badgeClass: 'bg-slate-50 text-slate-600 border-slate-200',
  };
}

export function truncateText(text?: string | null, maxLength: number = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength).trim()}...`;
}
