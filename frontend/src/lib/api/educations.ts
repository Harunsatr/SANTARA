import { apiGet, apiPost } from './client';
import {
  EducationArticle,
  ArticleImage,
  ApiResult,
  GetEducationsParams,
  CreateEducationPayload,
  UpdateEducationPayload,
  UploadArticleImagePayload,
  GetArticleImagesParams,
} from '@/types';
import { normalizeEducationArticles, normalizeEducationArticle } from '@/lib/normalizers/dataNormalizer';

/**
 * Mengambil artikel dan materi edukasi kesehatan (08_EDUCATIONS)
 */
export async function fetchEducations(
  params: GetEducationsParams = {}
): Promise<ApiResult<EducationArticle[]>> {
  const res = await apiGet<EducationArticle[]>('getEducations', params as Record<string, string | number | boolean | undefined>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeEducationArticles(res.data),
    };
  }
  return res;
}

/**
 * Menambahkan artikel edukasi baru
 */
export async function createEducation(
  payload: CreateEducationPayload
): Promise<ApiResult<EducationArticle>> {
  const res = await apiPost<EducationArticle>('createEducation', payload as unknown as Record<string, unknown>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeEducationArticle(res.data),
    };
  }
  return res;
}

/**
 * Memperbarui artikel edukasi
 */
export async function updateEducation(
  payload: UpdateEducationPayload
): Promise<ApiResult<EducationArticle>> {
  const res = await apiPost<EducationArticle>('updateEducation', payload as unknown as Record<string, unknown>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeEducationArticle(res.data),
    };
  }
  return res;
}

/**
 * Mengunggah gambar artikel ke Google Drive & mencatat metadata di 10_PIC_ARTIC
 */
export async function uploadArticleImage(
  payload: UploadArticleImagePayload
): Promise<ApiResult<ArticleImage>> {
  return apiPost<ArticleImage>('uploadArticleImage', payload as unknown as Record<string, unknown>);
}

/**
 * Mengambil metadata gambar artikel dari 10_PIC_ARTIC
 */
export async function fetchArticleImages(
  params: GetArticleImagesParams = {}
): Promise<ApiResult<ArticleImage[]>> {
  return apiGet<ArticleImage[]>('getArticleImages', params as Record<string, string | number | boolean | undefined>);
}
