import { apiGet, apiPost } from './client';
import {
  Student,
  ApiResult,
  GetStudentsParams,
  CreateStudentPayload,
  UpdateStudentPayload,
  ArchiveStudentPayload,
} from '@/types';
import { normalizeStudents, normalizeStudent } from '@/lib/normalizers/dataNormalizer';

/**
 * Mengambil daftar data siswa (04_STUDENTS)
 */
export async function fetchStudents(
  params: GetStudentsParams = {}
): Promise<ApiResult<Student[]>> {
  const res = await apiGet<Student[]>('getStudents', params as Record<string, string | number | boolean | undefined>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeStudents(res.data),
    };
  }
  return res;
}

/**
 * Menambahkan data siswa baru
 */
export async function createStudent(
  payload: CreateStudentPayload
): Promise<ApiResult<Student>> {
  const res = await apiPost<Student>('createStudent', payload as unknown as Record<string, unknown>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeStudent(res.data),
    };
  }
  return res;
}

/**
 * Memperbarui data siswa
 */
export async function updateStudent(
  payload: UpdateStudentPayload
): Promise<ApiResult<Student>> {
  const res = await apiPost<Student>('updateStudent', payload as unknown as Record<string, unknown>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeStudent(res.data),
    };
  }
  return res;
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
