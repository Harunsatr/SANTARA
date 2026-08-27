/**
 * SANTARA Data Normalizer Pipeline
 * Robust, defensive normalization layer between Google Sheets API and Application Models.
 * 
 * Ensures all types (string, number, boolean, null, undefined, object) returned by
 * Google Sheets / Google Apps Script are safely coerced into strict domain shapes
 * without crashing frontend components.
 */

import {
  ClassRoom,
  Student,
  Examination,
  School,
  TTDRecord,
  Screening,
  EducationArticle,
  User,
  Gender,
  StudentStatus,
  ScreeningType,
  UserRole,
} from '@/types/models';

/**
 * Coerces any unknown value into a trimmed string safely.
 * Never throws "x.trim is not a function".
 */
export function normalizeString(value: unknown, fallback: string = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  try {
    return String(value).trim();
  } catch {
    return fallback;
  }
}

/**
 * Coerces any unknown value into a valid number.
 * Handles comma decimal separators (e.g. "48,5"), strings, numbers, null/undefined.
 */
export function normalizeNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'number') return isNaN(value) ? fallback : value;
  const str = String(value).replace(',', '.').trim();
  const parsed = parseFloat(str);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Coerces any unknown value into a boolean.
 * Handles boolean, string ("true", "1", "ya", "yes", "TRUE"), number (1 / 0).
 */
export function normalizeBoolean(value: unknown, fallback: boolean = false): boolean {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const str = String(value).toLowerCase().trim();
  if (str === 'true' || str === '1' || str === 'ya' || str === 'yes') return true;
  if (str === 'false' || str === '0' || str === 'tidak' || str === 'no') return false;
  return fallback;
}

/**
 * Converts grade number or string to standard Roman numeral:
 * 10 / "10" / "X" -> "X"
 * 11 / "11" / "XI" -> "XI"
 * 12 / "12" / "XII" -> "XII"
 */
export function formatGradeToRoman(gradeOrName?: unknown): 'X' | 'XI' | 'XII' | string {
  const str = String(gradeOrName || '').trim().toUpperCase();
  if (str === '10' || str === 'X' || str.startsWith('10') || str.startsWith('X') || str.includes('KELAS 10') || str.includes('KELAS X')) {
    return 'X';
  }
  if (str === '11' || str === 'XI' || str.startsWith('11') || str.startsWith('XI') || str.includes('KELAS 11') || str.includes('KELAS XI')) {
    return 'XI';
  }
  if (str === '12' || str === 'XII' || str.startsWith('12') || str.startsWith('XII') || str.includes('KELAS 12') || str.includes('KELAS XII')) {
    return 'XII';
  }
  return str;
}

/**
 * Formats full class name to standard user-friendly Roman display:
 * - "Kelas 10", "10", "X", "Kelas X" -> "Kelas X"
 * - "Kelas 11", "11", "XI", "Kelas XI" -> "Kelas XI"
 * - "Kelas 12", "12", "XII", "Kelas XII" -> "Kelas XII"
 * - "X-1", "10-1", "Kelas 10-1" -> "Kelas X-1"
 * - "X-A", "10-A", "10 A" -> "Kelas X-A"
 */
export function formatClassNameToRoman(className?: unknown, grade?: unknown): string {
  const rawName = String(className || '').trim();
  const rawGrade = String(grade || '').trim();

  // If already starts with "Kelas X", "Kelas XI", "Kelas XII"
  if (/^Kelas\s+(XII|XI|X)(\b|[-_\s])/i.test(rawName)) {
    return rawName.replace(/^Kelas\s+/i, 'Kelas ');
  }

  // Handle "Kelas 12", "Kelas 11", "Kelas 10"
  if (/^Kelas\s+12(\b|[-_\s].*)?$/i.test(rawName)) {
    return rawName.replace(/^Kelas\s+12/i, 'Kelas XII');
  }
  if (/^Kelas\s+11(\b|[-_\s].*)?$/i.test(rawName)) {
    return rawName.replace(/^Kelas\s+11/i, 'Kelas XI');
  }
  if (/^Kelas\s+10(\b|[-_\s].*)?$/i.test(rawName)) {
    return rawName.replace(/^Kelas\s+10/i, 'Kelas X');
  }

  // Handle rombel without "Kelas" prefix, e.g. "10-1" -> "Kelas X-1", "11-A" -> "Kelas XI-A"
  if (/^12([-_\s].*)?$/i.test(rawName)) {
    return `Kelas ${rawName.replace(/^12/i, 'XII')}`;
  }
  if (/^11([-_\s].*)?$/i.test(rawName)) {
    return `Kelas ${rawName.replace(/^11/i, 'XI')}`;
  }
  if (/^10([-_\s].*)?$/i.test(rawName)) {
    return `Kelas ${rawName.replace(/^10/i, 'X')}`;
  }

  // Handle "X", "XI", "XII", "X-1", "XI-2"
  if (/^(XII|XI|X)([-_\s].*)?$/i.test(rawName)) {
    return `Kelas ${rawName.toUpperCase()}`;
  }

  // If rawName is general text (e.g. "MIPA 1"), use grade
  if (rawGrade) {
    const roman = formatGradeToRoman(rawGrade);
    return rawName ? `Kelas ${roman} ${rawName}` : `Kelas ${roman}`;
  }

  return rawName ? `Kelas ${rawName}` : 'Kelas X';
}

/**
 * Normalizes a raw ClassRoom entity from Google Sheets 03_CLASSES
 */
export function normalizeClassRoom(raw: unknown): ClassRoom {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      school_id: 'SCH001',
      class_name: 'Kelas X',
      grade: '10',
      academic_year: '2026/2027',
      address: '',
      status: 'active',
      created_at: '',
    };
  }

  const rec = raw as Record<string, unknown>;
  const id = normalizeString(rec.id);
  const gradeRaw = normalizeString(rec.grade);
  const classNameRaw = normalizeString(rec.class_name);

  // Derive numeric grade if not explicitly provided (default '10' for SMA)
  let derivedGrade = gradeRaw;
  if (!derivedGrade) {
    if (/XII|12/i.test(classNameRaw)) derivedGrade = '12';
    else if (/XI|11/i.test(classNameRaw)) derivedGrade = '11';
    else derivedGrade = '10';
  }

  // Format to standard Roman class name (e.g. "Kelas X", "Kelas XI", "Kelas XII")
  const normalizedClassName = formatClassNameToRoman(classNameRaw, derivedGrade);

  return {
    id,
    school_id: normalizeString(rec.school_id, 'SCH001'),
    class_name: normalizedClassName,
    grade: derivedGrade,
    academic_year: normalizeString(rec.academic_year, '2026/2027'),
    address: normalizeString(rec.address),
    status: normalizeString(rec.status, 'active'),
    created_at: normalizeString(rec.created_at),
  };
}

/**
 * Normalizes an array of ClassRoom entities
 */
export function normalizeClasses(rawList: unknown): ClassRoom[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(c => normalizeClassRoom(c))
    .filter(c => c.id !== '' && (c.class_name !== '' || c.grade !== ''));
}

/**
 * Normalizes a raw Student entity from Google Sheets 04_STUDENTS
 */
export function normalizeStudent(raw: unknown): Student {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      school_id: 'SCH001',
      class_id: '',
      student_code: '',
      nama: '',
      gender: 'L' as Gender,
      birth_date: '',
      status: 'active' as StudentStatus,
      created_at: '',
      updated_at: '',
    };
  }

  const rec = raw as Record<string, unknown>;
  const genderStr = normalizeString(rec.gender).toUpperCase();
  const statusStr = normalizeString(rec.status, 'active').toLowerCase();

  return {
    id: normalizeString(rec.id),
    school_id: normalizeString(rec.school_id, 'SCH001'),
    class_id: normalizeString(rec.class_id),
    student_code: normalizeString(rec.student_code),
    nama: normalizeString(rec.nama),
    gender: (genderStr === 'P' ? 'P' : 'L') as Gender,
    birth_date: normalizeString(rec.birth_date),
    status: (statusStr === 'inactive' ? 'inactive' : 'active') as StudentStatus,
    created_at: normalizeString(rec.created_at),
    updated_at: normalizeString(rec.updated_at),
  };
}

/**
 * Normalizes an array of Student entities
 */
export function normalizeStudents(rawList: unknown): Student[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(s => normalizeStudent(s))
    .filter(s => s.id !== '' && s.nama !== '');
}

/**
 * Normalizes a raw Examination entity from Google Sheets 05_EXAMINATIONS
 */
export function normalizeExamination(raw: unknown): Examination {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      student_id: '',
      class_id: '',
      examination_date: '',
      height_cm: 0,
      weight_kg: 0,
      bmi: 0,
      nutrional_status: 'Gizi Baik (Normal)',
      notes: '',
      examiner_id: '',
      created_at: '',
      updated_at: '',
    };
  }

  const rec = raw as Record<string, unknown>;
  const height = normalizeNumber(rec.height_cm, 0);
  const weight = normalizeNumber(rec.weight_kg, 0);
  let bmi = normalizeNumber(rec.bmi, 0);

  if (bmi === 0 && height > 0 && weight > 0) {
    const hM = height / 100;
    bmi = parseFloat((weight / (hM * hM)).toFixed(2));
  }

  return {
    id: normalizeString(rec.id),
    student_id: normalizeString(rec.student_id),
    class_id: normalizeString(rec.class_id),
    examination_date: normalizeString(rec.examination_date),
    height_cm: height,
    weight_kg: weight,
    bmi,
    nutrional_status: normalizeString(rec.nutrional_status, 'Gizi Baik (Normal)'),
    notes: normalizeString(rec.notes),
    examiner_id: normalizeString(rec.examiner_id),
    created_at: normalizeString(rec.created_at),
    updated_at: normalizeString(rec.updated_at),
  };
}

/**
 * Normalizes an array of Examination entities
 */
export function normalizeExaminations(rawList: unknown): Examination[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(e => normalizeExamination(e))
    .filter(e => e.id !== '' && e.student_id !== '');
}

/**
 * Normalizes a raw TTD Record entity from Google Sheets 07_TTD
 */
export function normalizeTTDRecord(raw: unknown): TTDRecord {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      student_id: '',
      class_id: '',
      consumption_date: '',
      consumed: true,
      quantity: 1,
      recorded_by: 'Kader SATRIA',
      notes: '',
      created_at: '',
      updated_at: '',
    };
  }

  const rec = raw as Record<string, unknown>;
  return {
    id: normalizeString(rec.id),
    student_id: normalizeString(rec.student_id),
    class_id: normalizeString(rec.class_id),
    consumption_date: normalizeString(rec.consumption_date),
    consumed: normalizeBoolean(rec.consumed, true),
    quantity: normalizeNumber(rec.quantity, 1),
    recorded_by: normalizeString(rec.recorded_by, 'Kader SATRIA'),
    notes: normalizeString(rec.notes),
    created_at: normalizeString(rec.created_at),
    updated_at: normalizeString(rec.updated_at),
  };
}

/**
 * Normalizes an array of TTD Record entities
 */
export function normalizeTTDRecords(rawList: unknown): TTDRecord[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(t => normalizeTTDRecord(t))
    .filter(t => t.id !== '');
}

/**
 * Normalizes a raw Screening entity from Google Sheets 06_SCREENINGS
 */
export function normalizeScreening(raw: unknown): Screening {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      student_id: '',
      class_id: '',
      screening_date: '',
      screening_type: 'Anemia',
      result: '-',
      notes: '',
      examiner_id: '',
      created_at: '',
      updated_at: '',
    };
  }

  const rec = raw as Record<string, unknown>;
  const typeStr = normalizeString(rec.screening_type, 'Anemia');

  return {
    id: normalizeString(rec.id),
    student_id: normalizeString(rec.student_id),
    class_id: normalizeString(rec.class_id),
    screening_date: normalizeString(rec.screening_date),
    screening_type: (typeStr.toLowerCase().includes('tekanan') ? 'Tekanan Darah' : 'Anemia') as ScreeningType,
    result: normalizeString(rec.result, '-'),
    notes: normalizeString(rec.notes),
    examiner_id: normalizeString(rec.examiner_id),
    created_at: normalizeString(rec.created_at),
    updated_at: normalizeString(rec.updated_at),
  };
}

/**
 * Normalizes an array of Screening entities
 */
export function normalizeScreenings(rawList: unknown): Screening[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(s => normalizeScreening(s))
    .filter(s => s.id !== '');
}

/**
 * Normalizes a raw School entity from Google Sheets 02_SCHOOLS
 */
export function normalizeSchool(raw: unknown): School {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      name: '',
      address: '',
      city: '',
      province: '',
      status: 'active',
      created_at: '',
    };
  }

  const rec = raw as Record<string, unknown>;
  return {
    id: normalizeString(rec.id),
    name: normalizeString(rec.name),
    address: normalizeString(rec.address),
    city: normalizeString(rec.city),
    province: normalizeString(rec.province),
    status: normalizeString(rec.status, 'active'),
    created_at: normalizeString(rec.created_at),
  };
}

/**
 * Normalizes an array of School entities
 */
export function normalizeSchools(rawList: unknown): School[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(s => normalizeSchool(s))
    .filter(s => s.id !== '');
}

/**
 * Normalizes a raw EducationArticle entity
 */
export function normalizeEducationArticle(raw: unknown): EducationArticle {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      title: '',
      slug: '',
      category: 'Umum',
      excerpt: '',
      content: '',
      thumbnail_url: '',
      image_url: '',
      status: 'published',
      created_by: 'Tim Kesehatan SANTARA',
      created_at: '',
      updated_at: '',
    };
  }

  const rec = raw as Record<string, unknown>;
  const titleStr = normalizeString(rec.title);
  let slugStr = normalizeString(rec.slug);
  if (!slugStr && titleStr) {
    slugStr = titleStr
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  return {
    id: normalizeString(rec.id),
    title: titleStr,
    slug: slugStr,
    category: normalizeString(rec.category, 'Umum'),
    excerpt: normalizeString(rec.excerpt),
    content: normalizeString(rec.content),
    thumbnail_url: normalizeString(rec.thumbnail_url || rec.cover_image_url),
    image_url: normalizeString(rec.image_url || rec.cover_image_url),
    status: normalizeString(rec.status, 'published'),
    created_by: normalizeString(rec.created_by || rec.author, 'Tim Kesehatan SANTARA'),
    created_at: normalizeString(rec.created_at),
    updated_at: normalizeString(rec.updated_at),
  };
}

/**
 * Normalizes an array of EducationArticle entities
 */
export function normalizeEducationArticles(rawList: unknown): EducationArticle[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(a => normalizeEducationArticle(a))
    .filter(a => a.id !== '' && a.title !== '');
}

/**
 * Normalizes a raw User entity from Google Sheets 01_USERS
 */
export function normalizeUser(raw: unknown): User {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      name: '',
      email: '',
      role: 'kader' as UserRole,
      school_id: 'SCH001',
      class_id: '',
      status: 'active',
      created_at: '',
    };
  }

  const rec = raw as Record<string, unknown>;
  return {
    id: normalizeString(rec.id),
    name: normalizeString(rec.nama || rec.name),
    email: normalizeString(rec.email),
    role: normalizeString(rec.role, 'kader') as UserRole,
    school_id: normalizeString(rec.school_id, 'SCH001'),
    class_id: normalizeString(rec.class_id),
    status: normalizeString(rec.status, 'active'),
    created_at: normalizeString(rec.created_at),
  };
}

/**
 * Normalizes an array of User entities
 */
export function normalizeUsers(rawList: unknown): User[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map(u => normalizeUser(u))
    .filter(u => u.id !== '' && u.email !== '');
}
