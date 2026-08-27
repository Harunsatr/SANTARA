import { apiGet, apiPost } from './client';
import { User, ApiResult, GetUsersParams } from '@/types';
import { normalizeUsers, normalizeUser } from '@/lib/normalizers/dataNormalizer';

/**
 * Mengambil master data pengguna / kader SATRIA & Kepala Sekolah (01_USERS)
 */
export async function fetchUsers(
  params: GetUsersParams = {}
): Promise<ApiResult<User[]>> {
  const res = await apiGet<User[]>('getUsers', params as Record<string, string | number | boolean | undefined>);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeUsers(res.data),
    };
  }
  return res;
}

/**
 * Memperbarui data / status akun pengguna (misal: aktifkan/nonaktifkan kader oleh Kepala Sekolah)
 */
export async function updateUser(
  data: Partial<User> & { id: string }
): Promise<ApiResult<User>> {
  const res = await apiPost<User>('updateUser', data);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeUser(res.data),
    };
  }
  return res;
}

/**
 * Mendaftarkan pengguna / kader baru
 */
export async function createUser(
  data: Omit<User, 'id' | 'created_at'>
): Promise<ApiResult<User>> {
  const res = await apiPost<User>('createUser', data);
  if (res.success && res.data) {
    return {
      ...res,
      data: normalizeUser(res.data),
    };
  }
  return res;
}
