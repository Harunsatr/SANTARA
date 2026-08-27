import { apiGet, apiPost } from './client';
import {
  Examination,
  ApiResult,
  GetExaminationsParams,
  CreateExaminationPayload,
  UpdateExaminationPayload,
} from '@/types';
import { normalizeExaminations, normalizeExamination } from '@/lib/normalizers/dataNormalizer';

/**
 * Mengambil data pemeriksaan antropometri gizi (05_EXAMINATIONS)
 */
export async function fetchExaminations(
  params: GetExaminationsParams = {}
): Promise<ApiResult<Examination[]>> {
  const res = await apiGet<Examination[]>('getExaminations', params as Record<string, string | number | boolean | undefined>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeExaminations(res.data),
    };
  }
  return res;
}

/**
 * Menambahkan data pemeriksaan antropometri gizi baru
 */
export async function createExamination(
  payload: CreateExaminationPayload
): Promise<ApiResult<Examination>> {
  const res = await apiPost<Examination>('createExamination', payload as unknown as Record<string, unknown>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeExamination(res.data),
    };
  }
  return res;
}

/**
 * Memperbarui data pemeriksaan antropometri gizi
 */
export async function updateExamination(
  payload: UpdateExaminationPayload
): Promise<ApiResult<Examination>> {
  const res = await apiPost<Examination>('updateExamination', payload as unknown as Record<string, unknown>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeExamination(res.data),
    };
  }
  return res;
}
