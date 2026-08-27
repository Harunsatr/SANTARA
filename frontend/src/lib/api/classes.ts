import { apiGet, apiPost } from './client';
import { ClassRoom, ApiResult, GetClassesParams } from '@/types';
import { normalizeClasses, normalizeClassRoom } from '@/lib/normalizers/dataNormalizer';

/**
 * Mengambil master data kelas (03_CLASSES)
 */
export async function fetchClasses(
  params: GetClassesParams = {}
): Promise<ApiResult<ClassRoom[]>> {
  const res = await apiGet<ClassRoom[]>('getClasses', params as Record<string, string | number | boolean | undefined>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeClasses(res.data),
    };
  }
  return res;
}

/**
 * Menambahkan data kelas baru (03_CLASSES)
 */
export async function createClass(
  data: Partial<ClassRoom> & { class_name: string; grade: string | number; school_id?: string }
): Promise<ApiResult<ClassRoom>> {
  const res = await apiPost<ClassRoom>('createClass', data);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeClassRoom(res.data),
    };
  }
  return res;
}
