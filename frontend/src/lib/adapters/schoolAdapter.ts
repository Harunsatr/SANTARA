/**
 * School, Class, and Student Compatibility Adapter
 * Handles data fallback for legacy references (e.g. STD002 -> SCH002)
 * and resolves names safely for UI presentation across SANTARA.
 */

import { School, ClassRoom, Student, StudentWithAge } from '@/types/models';
import {
  normalizeString,
  normalizeClassRoom,
  formatClassNameToRoman,
  formatGradeToRoman,
} from '@/lib/normalizers/dataNormalizer';

export { formatClassNameToRoman, formatGradeToRoman };

/**
 * Resolves student name safely from student ID and student list/map.
 * Fallback for unlisted IDs: "Data Siswa Tidak Ditemukan".
 */
export function resolveStudentName(
  studentId?: unknown,
  students: Student[] | Map<string, Student> = []
): string {
  const cleanId = normalizeString(studentId);
  if (!cleanId) {
    return 'Data Siswa Tidak Ditemukan';
  }

  let found: Student | undefined;
  if (students instanceof Map) {
    found = students.get(cleanId);
  } else if (Array.isArray(students)) {
    found = students.find(s => normalizeString(s?.id) === cleanId);
  }

  if (found && found.nama) {
    const cleanNama = normalizeString(found.nama);
    if (cleanNama) return cleanNama;
  }

  return 'Data Siswa Tidak Ditemukan';
}

/**
 * Resolves full student record safely.
 */
export function resolveStudent(
  studentId?: unknown,
  students: Student[] | Map<string, Student> = []
): Student | undefined {
  const cleanId = normalizeString(studentId);
  if (!cleanId) return undefined;

  if (students instanceof Map) {
    return students.get(cleanId);
  } else if (Array.isArray(students)) {
    return students.find(s => normalizeString(s?.id) === cleanId);
  }

  return undefined;
}

/**
 * Resolves school name safely from school ID and school list.
 * Fallback for unlisted IDs: "Sekolah {id} (Belum Terdaftar)".
 */
export function resolveSchoolName(schoolId?: unknown, schools: School[] = []): string {
  const cleanId = normalizeString(schoolId);
  if (!cleanId) {
    return 'Sekolah Tidak Terdaftar';
  }

  if (Array.isArray(schools)) {
    const found = schools.find(s => normalizeString(s?.id) === cleanId);
    if (found && found.name) {
      const cleanName = normalizeString(found.name);
      if (cleanName) return cleanName;
    }
  }

  return `Sekolah ${cleanId} (Belum Terdaftar)`;
}

/**
 * Resolves class name safely from class ID and class list.
 */
export function resolveClassName(classId?: unknown, classes: ClassRoom[] = []): string {
  const cleanId = normalizeString(classId);
  if (!cleanId) {
    return 'Kelas Tidak Terdaftar';
  }

  if (Array.isArray(classes)) {
    const found = classes.find(c => normalizeString(c?.id) === cleanId);
    if (found) {
      const rawClassName = normalizeString(found.class_name);
      const rawGrade = normalizeString(found.grade);
      return formatClassNameToRoman(rawClassName, rawGrade);
    }
  }

  return `Kelas ${cleanId}`;
}

/**
 * Filters out template placeholder classes that do not have a class_name or grade yet.
 * CRITICAL: This is only a presentation layer filter; no records are deleted from backend.
 */
export function filterValidClasses(classes: ClassRoom[] = []): ClassRoom[] {
  if (!Array.isArray(classes)) return [];
  return classes
    .map(c => normalizeClassRoom(c))
    .filter(c => c.id !== '' && (c.class_name !== '' || c.grade !== ''));
}

/**
 * Calculates student age from birth date string.
 */
export function calculateAge(birthDateStr?: unknown, targetDateStr?: unknown): {
  years?: number;
  months?: number;
  formatted: string;
} {
  const cleanBirth = normalizeString(birthDateStr);
  const cleanTarget = normalizeString(targetDateStr);

  if (!cleanBirth) {
    return { formatted: '-' };
  }

  try {
    const birth = new Date(cleanBirth);
    const target = cleanTarget ? new Date(cleanTarget) : new Date();

    if (isNaN(birth.getTime()) || isNaN(target.getTime())) {
      return { formatted: '-' };
    }

    let years = target.getFullYear() - birth.getFullYear();
    let months = target.getMonth() - birth.getMonth();

    if (target.getDate() < birth.getDate()) {
      months--;
    }

    if (months < 0) {
      years--;
      months += 12;
    }

    if (years < 0) {
      return { formatted: '-' };
    }

    const formatted = months > 0 ? `${years} thn ${months} bln` : `${years} thn`;
    return {
      years,
      months,
      formatted,
    };
  } catch {
    return { formatted: '-' };
  }
}

/**
 * Enhances student record with resolved school, class name, and age.
 */
export function adaptStudentForUI(
  student: Student,
  schools: School[] = [],
  classes: ClassRoom[] = []
): StudentWithAge {
  const age = calculateAge(student.birth_date);
  return {
    ...student,
    age_years: age.years,
    age_months: age.months,
    formatted_age: age.formatted,
    school_name: resolveSchoolName(student.school_id, schools),
    class_name: resolveClassName(student.class_id, classes),
  };
}
