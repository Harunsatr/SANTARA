import { apiGet, apiPost } from './client';
import { User, ApiResult, GetUsersParams } from '@/types';

/**
 * Mengambil master data pengguna / kader SATRIA & Kepala Sekolah (01_USERS)
 */
export async function fetchUsers(
  params: GetUsersParams = {}
): Promise<ApiResult<User[]>> {
  return apiGet<User[]>('getUsers', params as Record<string, string | number | boolean | undefined>);
}

/**
 * Memperbarui data / status akun pengguna (misal: aktifkan/nonaktifkan kader oleh Kepala Sekolah)
 */
export async function updateUser(
  data: Partial<User> & { id: string }
): Promise<ApiResult<User>> {
  return apiPost<User>('updateUser', data);
}

/**
 * Mendaftarkan pengguna / kader baru
 */
export async function createUser(
  data: Omit<User, 'id' | 'created_at'>
): Promise<ApiResult<User>> {
  return apiPost<User>('createUser', data);
}
