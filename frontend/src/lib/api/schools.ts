import { apiGet } from './client';
import { School, ApiResult } from '@/types';
import { normalizeSchools } from '@/lib/normalizers/dataNormalizer';

/**
 * Mengambil master data sekolah (02_SCHOOLS)
 */
export async function fetchSchools(): Promise<ApiResult<School[]>> {
  const res = await apiGet<School[]>('getSchools');
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeSchools(res.data),
    };
  }
  return res;
}
