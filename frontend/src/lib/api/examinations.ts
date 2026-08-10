import { apiGet, apiPost } from './client';
import {
  Examination,
  ApiResult,
  GetExaminationsParams,
  CreateExaminationPayload,
  UpdateExaminationPayload,
} from '@/types';

/**
 * Mengambil data pemeriksaan antropometri gizi (05_EXAMINATIONS)
 */
export async function fetchExaminations(
  params: GetExaminationsParams = {}
): Promise<ApiResult<Examination[]>> {
  return apiGet<Examination[]>('getExaminations', params as Record<string, string | number | boolean | undefined>);
}

/**
 * Menambahkan data pemeriksaan antropometri gizi baru
 */
export async function createExamination(
  payload: CreateExaminationPayload
): Promise<ApiResult<Examination>> {
  return apiPost<Examination>('createExamination', payload as unknown as Record<string, unknown>);
}

/**
 * Memperbarui data pemeriksaan antropometri gizi
 */
export async function updateExamination(
  payload: UpdateExaminationPayload
): Promise<ApiResult<Examination>> {
  return apiPost<Examination>('updateExamination', payload as unknown as Record<string, unknown>);
}
