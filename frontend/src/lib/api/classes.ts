import { apiGet, apiPost } from './client';
import { ClassRoom, ApiResult, GetClassesParams } from '@/types';

/**
 * Mengambil master data kelas (03_CLASSES)
 */
export async function fetchClasses(
  params: GetClassesParams = {}
): Promise<ApiResult<ClassRoom[]>> {
  return apiGet<ClassRoom[]>('getClasses', params as Record<string, string | number | boolean | undefined>);
}

/**
 * Menambahkan data kelas baru (03_CLASSES)
 */
export async function createClass(
  data: Partial<ClassRoom> & { class_name: string; grade: string | number; school_id?: string }
): Promise<ApiResult<ClassRoom>> {
  return apiPost<ClassRoom>('createClass', data);
}
