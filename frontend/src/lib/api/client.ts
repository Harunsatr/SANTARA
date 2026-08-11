/**
 * SANTARA Centralized API Client
 * Robust HTTP client designed for Google Apps Script Web App REST API.
 * 
 * Features:
 * - Next.js internal server-side proxy route (/api/santara) to eliminate browser CORS & 302 redirect issues
 * - Automatic retry with exponential backoff on transient network hiccups
 * - Clean error mapping and normalized response structure
 */

import { ApiResult } from '@/types/api';

const DIRECT_GAS_URL = '';

export function getApiBaseUrl(): string {
  // In the browser, use the same-origin Next.js proxy route to prevent CORS / 302 errors
  if (typeof window !== 'undefined') {
    return '/api/santara';
  }

  // On the server, use direct GAS endpoint
  const envUrl = process.env.NEXT_PUBLIC_SANTARA_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim();
  }
  return DIRECT_GAS_URL;
}

export interface RequestOptions {
  timeoutMs?: number;
  cache?: RequestCache;
  retries?: number;
}

/**
 * Execute a GET request to the SANTARA API with retry capability
 */
export async function apiGet<T>(
  action: string,
  params: Record<string, string | number | boolean | undefined | null> = {},
  options: RequestOptions = {}
): Promise<ApiResult<T>> {
  const isBrowser = typeof window !== 'undefined';
  const primaryUrl = getApiBaseUrl();
  const maxRetries = options.retries ?? 2;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // On retry > 0 or if proxy fails in browser, we can also try direct fallback
      const targetBase = attempt > 0 && isBrowser && attempt === maxRetries
        ? DIRECT_GAS_URL
        : primaryUrl;

      const url = new URL(
        targetBase.startsWith('/')
          ? `${window.location.origin}${targetBase}`
          : targetBase
      );

      if (action) {
        url.searchParams.set('action', action);
      }

      // Append query parameters
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          url.searchParams.set(key, String(val).trim());
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeoutMs || 25000
      );

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
        cache: options.cache || 'no-store',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Gagal memuat data`);
      }

      const rawJson = await response.json();

      if (rawJson && rawJson.success === true) {
        return {
          success: true,
          data: rawJson.data as T,
          total: typeof rawJson.total === 'number' ? rawJson.total : undefined,
          message: rawJson.message || 'Operasi berhasil',
        };
      } else {
        return {
          success: false,
          error: rawJson?.error || 'API_ERROR',
          message: rawJson?.message || 'Terjadi kesalahan pada respon server',
          rawError: rawJson,
        };
      }
    } catch (error: unknown) {
      lastError = error;
      if (attempt < maxRetries) {
        // Wait before next attempt (300ms, 600ms)
        await new Promise(r => setTimeout(r, (attempt + 1) * 300));
      }
    }
  }

  if (lastError instanceof Error && lastError.name === 'AbortError') {
    return {
      success: false,
      error: 'TIMEOUT',
      message: 'Permintaan data melebihi batas waktu (timeout). Silakan periksa koneksi internet Anda.',
    };
  }

  const errorMsg =
    lastError instanceof Error && lastError.message
      ? lastError.message
      : 'Koneksi ke server database gagal. Silakan klik Refresh Data untuk mencoba kembali.';

  return {
    success: false,
    error: 'NETWORK_ERROR',
    message: errorMsg,
    rawError: lastError,
  };
}

/**
 * Execute a POST mutation request to the SANTARA API with retry capability
 */
export async function apiPost<T>(
  action: string,
  data: Record<string, unknown>,
  options: RequestOptions = {}
): Promise<ApiResult<T>> {
  const isBrowser = typeof window !== 'undefined';
  const primaryUrl = getApiBaseUrl();
  const maxRetries = options.retries ?? 1;

  let lastError: unknown = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const targetBase = attempt > 0 && isBrowser && attempt === maxRetries
        ? DIRECT_GAS_URL
        : primaryUrl;

      const fullUrl = targetBase.startsWith('/')
        ? `${window.location.origin}${targetBase}`
        : targetBase;

      const payload = {
        action,
        data,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(
        () => controller.abort(),
        options.timeoutMs || 30000
      );

      const response = await fetch(fullUrl, {
        method: 'POST',
        redirect: 'follow',
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Gagal mengirim data`);
      }

      const rawJson = await response.json();

      if (rawJson && rawJson.success === true) {
        return {
          success: true,
          data: rawJson.data as T,
          total: typeof rawJson.total === 'number' ? rawJson.total : undefined,
          message: rawJson.message || 'Data berhasil disimpan',
        };
      } else {
        return {
          success: false,
          error: rawJson?.error || 'MUTATION_ERROR',
          message: rawJson?.message || 'Gagal memproses data pada server',
          rawError: rawJson,
        };
      }
    } catch (error: unknown) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, (attempt + 1) * 400));
      }
    }
  }

  if (lastError instanceof Error && lastError.name === 'AbortError') {
    return {
      success: false,
      error: 'TIMEOUT',
      message: 'Pengiriman data melebihi batas waktu (timeout). Silakan coba lagi.',
    };
  }

  const errorMsg =
    lastError instanceof Error && lastError.message
      ? lastError.message
      : 'Koneksi ke server gagal. Silakan periksa jaringan dan coba lagi.';

  return {
    success: false,
    error: 'NETWORK_ERROR',
    message: errorMsg,
    rawError: lastError,
  };
}
