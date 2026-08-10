import { apiGet, apiPost } from './client';
import {
  Student,
  ApiResult,
  GetStudentsParams,
  CreateStudentPayload,
  UpdateStudentPayload,
  ArchiveStudentPayload,
} from '@/types';

/**
 * Mengambil daftar data siswa (04_STUDENTS)
 */
export async function fetchStudents(
  params: GetStudentsParams = {}
): Promise<ApiResult<Student[]>> {
  return apiGet<Student[]>('getStudents', params as Record<string, string | number | boolean | undefined>);
}

/**
 * Menambahkan data siswa baru
 */
export async function createStudent(
  payload: CreateStudentPayload
): Promise<ApiResult<Student>> {
  return apiPost<Student>('createStudent', payload as unknown as Record<string, unknown>);
}

/**
 * Memperbarui data siswa
 */
export async function updateStudent(
  payload: UpdateStudentPayload
): Promise<ApiResult<Student>> {
  return apiPost<Student>('updateStudent', payload as unknown as Record<string, unknown>);
}

/**
 * Mengarsipkan / soft-delete siswa (status -> inactive)
 */
export async function archiveStudent(
  payload: ArchiveStudentPayload
): Promise<ApiResult<{ id: string; status: string }>> {
  return apiPost<{ id: string; status: string }>(
    'archiveStudent',
    payload as unknown as Record<string, unknown>
  );
}
