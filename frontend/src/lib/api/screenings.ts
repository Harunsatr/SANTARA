import { apiGet, apiPost } from './client';
import {
  Screening,
  ApiResult,
  GetScreeningsParams,
  CreateScreeningPayload,
  UpdateScreeningPayload,
} from '@/types';
import { normalizeScreenings, normalizeScreening } from '@/lib/normalizers/dataNormalizer';

/**
 * Mengambil data skrining kesehatan (06_SCREENINGS)
 */
export async function fetchScreenings(
  params: GetScreeningsParams = {}
): Promise<ApiResult<Screening[]>> {
  const res = await apiGet<Screening[]>('getScreenings', params as Record<string, string | number | boolean | undefined>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeScreenings(res.data),
    };
  }
  return res;
}

/**
 * Menambahkan catatan skrining kesehatan baru
 */
export async function createScreening(
  payload: CreateScreeningPayload
): Promise<ApiResult<Screening>> {
  const res = await apiPost<Screening>('createScreening', payload as unknown as Record<string, unknown>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeScreening(res.data),
    };
  }
  return res;
}

/**
 * Memperbarui catatan skrining kesehatan
 */
export async function updateScreening(
  payload: UpdateScreeningPayload
): Promise<ApiResult<Screening>> {
  const res = await apiPost<Screening>('updateScreening', payload as unknown as Record<string, unknown>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeScreening(res.data),
    };
  }
  return res;
}
