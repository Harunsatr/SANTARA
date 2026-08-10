import { apiGet, apiPost } from './client';
import {
  Screening,
  ApiResult,
  GetScreeningsParams,
  CreateScreeningPayload,
  UpdateScreeningPayload,
} from '@/types';

/**
 * Mengambil data skrining kesehatan (06_SCREENINGS)
 */
export async function fetchScreenings(
  params: GetScreeningsParams = {}
): Promise<ApiResult<Screening[]>> {
  return apiGet<Screening[]>('getScreenings', params as Record<string, string | number | boolean | undefined>);
}

/**
 * Menambahkan catatan skrining kesehatan baru
 */
export async function createScreening(
  payload: CreateScreeningPayload
): Promise<ApiResult<Screening>> {
  return apiPost<Screening>('createScreening', payload as unknown as Record<string, unknown>);
}

/**
 * Memperbarui catatan skrining kesehatan
 */
export async function updateScreening(
  payload: UpdateScreeningPayload
): Promise<ApiResult<Screening>> {
  return apiPost<Screening>('updateScreening', payload as unknown as Record<string, unknown>);
}
