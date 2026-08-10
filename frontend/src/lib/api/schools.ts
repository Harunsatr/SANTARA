import { apiGet } from './client';
import { School, ApiResult } from '@/types';

/**
 * Mengambil master data sekolah (02_SCHOOLS)
 */
export async function fetchSchools(): Promise<ApiResult<School[]>> {
  return apiGet<School[]>('getSchools');
}
