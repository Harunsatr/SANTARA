import { apiGet } from './client';
import { User, ApiResult, GetUsersParams } from '@/types';

/**
 * Mengambil master data pengguna / guru SATRIA (01_USERS)
 */
export async function fetchUsers(
  params: GetUsersParams = {}
): Promise<ApiResult<User[]>> {
  return apiGet<User[]>('getUsers', params as Record<string, string | number | boolean | undefined>);
}
