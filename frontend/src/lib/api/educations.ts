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
