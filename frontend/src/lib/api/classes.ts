import { apiGet } from './client';
import { ClassRoom, ApiResult, GetClassesParams } from '@/types';

/**
 * Mengambil master data kelas (03_CLASSES)
 */
export async function fetchClasses(
  params: GetClassesParams = {}
): Promise<ApiResult<ClassRoom[]>> {
  return apiGet<ClassRoom[]>('getClasses', params as Record<string, string | number | boolean | undefined>);
}
