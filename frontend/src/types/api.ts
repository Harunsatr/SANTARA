/**
 * SANTARA API Protocol & Response Types
 * Matches the Google Apps Script Web App JSON contract
 */

import {
  Gender,
  StudentStatus,
  EducationStatus,
  ScreeningType,
} from './models';

/**
 * Standard API Responses
 */
export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  total?: number;
}

export interface ApiListResponse<T> {
  success: true;
  message: string;
  total: number;
  data: T[];
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: string;
  action?: string;
  error_detail?: string;
  [key: string]: unknown;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * GET Query Parameters
 */
export interface GetStudentsParams {
  school_id?: string;
  class_id?: string;
  status?: StudentStatus | string;
}

export interface GetExaminationsParams {
  student_id?: string;
  class_id?: string;
}

export interface GetScreeningsParams {
  student_id?: string;
  class_id?: string;
  screening_type?: ScreeningType;
}

export interface GetTTDParams {
  student_id?: string;
  class_id?: string;
}

export interface GetEducationsParams {
  category?: string;
  status?: EducationStatus;
}

export interface GetClassesParams {
  school_id?: string;
}

export interface GetUsersParams {
  school_id?: string;
  role?: string;
  status?: string;
}

/**
 * POST Mutation Payloads
 */

// Students
export interface CreateStudentPayload {
  school_id: string;
  class_id: string;
  student_code: string;
  nama: string;
  gender: Gender;
  birth_date?: string;
  status?: StudentStatus;
  user_id?: string;
}

export interface UpdateStudentPayload {
  id: string;
  school_id?: string;
  class_id?: string;
  student_code?: string;
  nama?: string;
  gender?: Gender;
  birth_date?: string;
  status?: StudentStatus;
  user_id?: string;
}

export interface ArchiveStudentPayload {
  id: string;
  user_id?: string;
}

// Examinations
export interface CreateExaminationPayload {
  student_id: string;
  class_id: string;
  examination_date: string;
  weight_kg: number;
  height_cm: number;
  nutrional_status?: string; // Exact backend field
  examiner_id?: string;
  notes?: string;
  user_id?: string;
}

export interface UpdateExaminationPayload {
  id: string;
  student_id?: string;
  class_id?: string;
  examination_date?: string;
  weight_kg?: number;
  height_cm?: number;
  nutrional_status?: string; // Exact backend field
  examiner_id?: string;
  notes?: string;
  user_id?: string;
}

// Screenings
export interface CreateScreeningPayload {
  student_id: string;
  class_id: string;
  screening_date: string;
  screening_type: ScreeningType;
  result: string;
  notes?: string;
  examiner_id?: string;
  user_id?: string;
}

export interface UpdateScreeningPayload {
  id: string;
  student_id?: string;
  class_id?: string;
  screening_date?: string;
  screening_type?: ScreeningType;
  result?: string;
  notes?: string;
  examiner_id?: string;
  user_id?: string;
}

// TTD (Tablet Tambah Darah)
export interface CreateTTDPayload {
  student_id: string;
  class_id: string;
  consumption_date: string;
  consumed: boolean | string;
  quantity?: number;
  recorded_by?: string;
  notes?: string;
  user_id?: string;
}

export interface UpdateTTDPayload {
  id: string;
  student_id?: string;
  class_id?: string;
  consumption_date?: string;
  consumed?: boolean | string;
  quantity?: number;
  recorded_by?: string;
  notes?: string;
  user_id?: string;
}

// Educations
export interface CreateEducationPayload {
  title: string;
  content: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  thumbnail_url?: string;
  status?: EducationStatus;
  created_by?: string;
  user_id?: string;
}

export interface UpdateEducationPayload {
  id: string;
  title?: string;
  slug?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  thumbnail_url?: string;
  status?: EducationStatus;
  user_id?: string;
}

// Article Images (10_PIC_ARTIC)
export interface UploadArticleImagePayload {
  article_id: string;
  filename: string;
  mime_type: string;
  base64_data: string;
  uploaded_by?: string;
  user_id?: string;
}

export interface GetArticleImagesParams {
  article_id?: string;
}

/**
 * Normalized API Client Result
 */
export type ApiResult<T> =
  | { success: true; data: T; total?: number; message: string }
  | { success: false; error: string; message: string; rawError?: unknown };
