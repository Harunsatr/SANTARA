/**
 * School, Class, and Student Compatibility Adapter
 * Handles data fallback for legacy references (e.g. STD002 -> SCH002)
 * and resolves names safely for UI presentation across SANTARA.
 */

import { School, ClassRoom, Student, StudentWithAge } from '@/types/models';

/**
 * Resolves student name safely from student ID and student list/map.
 * Fallback for unlisted IDs: "Data Siswa Tidak Ditemukan".
 */
export function resolveStudentName(
  studentId?: string,
  students: Student[] | Map<string, Student> = []
): string {
  if (!studentId || studentId.trim() === '') {
    return 'Data Siswa Tidak Ditemukan';
  }

  let found: Student | undefined;
  if (students instanceof Map) {
    found = students.get(studentId.trim());
  } else if (Array.isArray(students)) {
    found = students.find(s => s.id === studentId.trim());
  }

  if (found && found.nama && found.nama.trim() !== '') {
    return found.nama;
  }

  return 'Data Siswa Tidak Ditemukan';
}

/**
 * Resolves full student record safely.
 */
export function resolveStudent(
  studentId?: string,
  students: Student[] | Map<string, Student> = []
): Student | undefined {
  if (!studentId || studentId.trim() === '') return undefined;

  if (students instanceof Map) {
    return students.get(studentId.trim());
  } else if (Array.isArray(students)) {
    return students.find(s => s.id === studentId.trim());
  }

  return undefined;
}

/**
 * Resolves school name safely from school ID and school list.
 * Fallback for unlisted IDs: "Sekolah {id} (Belum Terdaftar)".
 */
export function resolveSchoolName(schoolId?: string, schools: School[] = []): string {
  if (!schoolId || schoolId.trim() === '') {
    return 'Sekolah Tidak Terdaftar';
  }

  const found = schools.find(s => s.id === schoolId.trim());
  if (found && found.name) {
    return found.name;
  }

  return `Sekolah ${schoolId} (Belum Terdaftar)`;
}

/**
 * Resolves class name safely from class ID and class list.
 */
export function resolveClassName(classId?: string, classes: ClassRoom[] = []): string {
  if (!classId || classId.trim() === '') {
    return 'Kelas Tidak Terdaftar';
  }

  const found = classes.find(c => c.id === classId.trim());
  if (found && found.class_name) {
    const gradePrefix = found.grade ? `Kelas ${found.grade} ` : 'Kelas ';
    return `${gradePrefix}${found.class_name}`;
  }

  return `Kelas ${classId}`;
}

/**
 * Filters out template placeholder classes that do not have a class_name yet.
 * CRITICAL: This is only a presentation layer filter; no records are deleted from backend.
 */
export function filterValidClasses(classes: ClassRoom[] = []): ClassRoom[] {
  return classes.filter(
    c => c.id && c.class_name && c.class_name.trim() !== ''
  );
}

/**
 * Calculates student age from birth date string.
 */
export function calculateAge(birthDateStr?: string, targetDateStr?: string): {
  years?: number;
  months?: number;
  formatted: string;
} {
  if (!birthDateStr || birthDateStr.trim() === '') {
    return { formatted: '-' };
  }

  try {
    const birth = new Date(birthDateStr);
    const target = targetDateStr ? new Date(targetDateStr) : new Date();

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
