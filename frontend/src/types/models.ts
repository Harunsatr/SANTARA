/**
 * SANTARA Domain Models & Database Schemas
 * Source of Truth: Google Sheets SANTARA_DATABASE & Kode.js Production API
 * 
 * CRITICAL RULE: Field `nutrional_status` MUST be preserved exactly as named in backend.
 */

export type Gender = 'L' | 'P';
export type StudentStatus = 'active' | 'inactive';
export type EducationStatus = 'draft' | 'published' | string;
export type UserRole = 'KEPALA_SEKOLAH' | 'KADER' | 'ADMIN' | 'GURU' | 'SISWA' | 'kepala_sekolah' | 'admin' | 'kader' | 'guru' | 'siswa' | string;

export type NutritionStatusCategory =
  | 'Severely Thinness'
  | 'Thinness'
  | 'Normal'
  | 'Overweight'
  | 'Obese'
  | 'UNKNOWN';

export type ScreeningType =
  | 'Anemia'
  | 'Tekanan Darah'
  | 'Umum'
  | string;

/**
 * 01_USERS Schema
 */
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  school_id: string;
  class_id: string;
  status: string;
  created_at: string;
}

/**
 * 02_SCHOOLS Schema
 */
export interface School {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string;
  status: string;
  created_at: string;
}

/**
 * 03_CLASSES Schema
 */
export interface ClassRoom {
  id: string;
  school_id: string;
  address: string;
  academic_year: string;
  grade: number | string;
  class_name: string;
  status: string;
  created_at: string;
}

/**
 * 04_STUDENTS Schema
 */
export interface Student {
  id: string;
  school_id: string;
  class_id: string;
  student_code: string;
  nama: string;
  gender: Gender;
  birth_date: string;
  status: StudentStatus;
  created_at: string;
  updated_at: string;
}

/**
 * 05_EXAMINATIONS Schema
 * CRITICAL: `nutrional_status` is exact backend column name.
 */
export interface Examination {
  id: string;
  student_id: string;
  class_id: string;
  examination_date: string;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  nutrional_status: string; // EXACT BACKEND SPELLING
  examiner_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * 06_SCREENINGS Schema
 */
export interface Screening {
  id: string;
  student_id: string;
  class_id: string;
  screening_date: string;
  screening_type: ScreeningType;
  result: string;
  notes: string;
  examiner_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * 07_TTD Schema (Tablet Tambah Darah)
 */
export interface TTDRecord {
  id: string;
  student_id: string;
  class_id: string;
  consumption_date: string;
  consumed: boolean | string;
  quantity: number;
  recorded_by: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

/**
 * 08_EDUCATIONS Schema
 */
export interface EducationArticle {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  thumbnail_url: string;
  status: EducationStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * 09_AUDIT_LOG Schema
 */
export interface AuditLogEntry {
  id: string;
  user_id: string;
  action: 'CREATE' | 'UPDATE' | 'ARCHIVE' | string;
  table_name: string;
  record_id: string;
  description: string;
  timestamp: string;
}

/**
 * Enhanced Domain Models for UI / Adapter Layer
 */
export interface ExaminationWithLiLA extends Examination {
  lila_cm?: number;
  clean_notes?: string;
}

export interface StudentWithAge extends Student {
  age_years?: number;
  age_months?: number;
  formatted_age?: string;
  school_name?: string;
  class_name?: string;
}
