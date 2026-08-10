import { apiGet, apiPost } from './client';
import {
  TTDRecord,
  ApiResult,
  GetTTDParams,
  CreateTTDPayload,
  UpdateTTDPayload,
} from '@/types';

/**
 * Mengambil log konsumsi Tablet Tambah Darah (07_TTD)
 */
export async function fetchTTD(
  params: GetTTDParams = {}
): Promise<ApiResult<TTDRecord[]>> {
  return apiGet<TTDRecord[]>('getTTD', params as Record<string, string | number | boolean | undefined>);
}

/**
 * Mencatat konsumsi Tablet Tambah Darah baru
 */
export async function createTTD(
  payload: CreateTTDPayload
): Promise<ApiResult<TTDRecord>> {
  return apiPost<TTDRecord>('createTTD', payload as unknown as Record<string, unknown>);
}

/**
 * Memperbarui catatan konsumsi Tablet Tambah Darah
 */
export async function updateTTD(
  payload: UpdateTTDPayload
): Promise<ApiResult<TTDRecord>> {
  return apiPost<TTDRecord>('updateTTD', payload as unknown as Record<string, unknown>);
}
