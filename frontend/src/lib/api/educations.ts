import { apiGet, apiPost } from './client';
import {
  EducationArticle,
  ApiResult,
  GetEducationsParams,
  CreateEducationPayload,
  UpdateEducationPayload,
} from '@/types';

/**
 * Mengambil artikel dan materi edukasi kesehatan (08_EDUCATIONS)
 */
export async function fetchEducations(
  params: GetEducationsParams = {}
): Promise<ApiResult<EducationArticle[]>> {
  return apiGet<EducationArticle[]>('getEducations', params as Record<string, string | number | boolean | undefined>);
}

/**
 * Menambahkan artikel edukasi baru
 */
export async function createEducation(
  payload: CreateEducationPayload
): Promise<ApiResult<EducationArticle>> {
  return apiPost<EducationArticle>('createEducation', payload as unknown as Record<string, unknown>);
}

/**
 * Memperbarui artikel edukasi
 */
export async function updateEducation(
  payload: UpdateEducationPayload
): Promise<ApiResult<EducationArticle>> {
  return apiPost<EducationArticle>('updateEducation', payload as unknown as Record<string, unknown>);
}
