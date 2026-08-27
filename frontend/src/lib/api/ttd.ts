import { apiGet, apiPost } from './client';
import {
  TTDRecord,
  ApiResult,
  GetTTDParams,
  CreateTTDPayload,
  UpdateTTDPayload,
} from '@/types';
import { normalizeTTDRecords, normalizeTTDRecord } from '@/lib/normalizers/dataNormalizer';

/**
 * Mengambil log konsumsi Tablet Tambah Darah (07_TTD)
 */
export async function fetchTTD(
  params: GetTTDParams = {}
): Promise<ApiResult<TTDRecord[]>> {
  const res = await apiGet<TTDRecord[]>('getTTD', params as Record<string, string | number | boolean | undefined>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeTTDRecords(res.data),
    };
  }
  return res;
}

/**
 * Mencatat konsumsi Tablet Tambah Darah baru
 */
export async function createTTD(
  payload: CreateTTDPayload
): Promise<ApiResult<TTDRecord>> {
  const res = await apiPost<TTDRecord>('createTTD', payload as unknown as Record<string, unknown>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeTTDRecord(res.data),
    };
  }
  return res;
}

/**
 * Memperbarui catatan konsumsi Tablet Tambah Darah
 */
export async function updateTTD(
  payload: UpdateTTDPayload
): Promise<ApiResult<TTDRecord>> {
  const res = await apiPost<TTDRecord>('updateTTD', payload as unknown as Record<string, unknown>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeTTDRecord(res.data),
    };
  }
  return res;
}
