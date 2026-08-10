import { NextRequest, NextResponse } from 'next/server';

const GAS_API_URL =
  process.env.SANTARA_SERVER_API_URL ||
  process.env.NEXT_PUBLIC_SANTARA_API_URL ||
  'https://script.google.com/macros/s/AKfycby-x8OD8YHovfac2hf3R65WPGQYd1iR8lTDy06dafBzn9LFRPAjbEfYjZwiRzrE_AIayw/exec';

/**
 * Server-side Proxy GET Handler
 * Bypasses browser CORS restrictions, adblockers, and 302 redirect issues.
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const targetUrl = new URL(GAS_API_URL);

    searchParams.forEach((val, key) => {
      targetUrl.searchParams.set(key, val);
    });

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < 3) {
      attempts++;
      try {
        const response = await fetch(targetUrl.toString(), {
          method: 'GET',
          redirect: 'follow',
          cache: 'no-store',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data, { status: 200 });
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error('Network error to backend');
        // Wait 300ms before retry
        await new Promise(r => setTimeout(r, 300));
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'BACKEND_FETCH_FAILED',
        message: lastError?.message || 'Gagal menghubungi server database Google Sheets.',
      },
      { status: 502 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal proxy error';
    return NextResponse.json(
      { success: false, error: 'PROXY_ERROR', message: msg },
      { status: 500 }
    );
  }
}

/**
 * Server-side Proxy POST Handler
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < 3) {
      attempts++;
      try {
        const response = await fetch(GAS_API_URL, {
          method: 'POST',
          redirect: 'follow',
          cache: 'no-store',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
            Accept: 'application/json',
          },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data, { status: 200 });
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error('Network error on mutation');
        await new Promise(r => setTimeout(r, 400));
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'BACKEND_POST_FAILED',
        message: lastError?.message || 'Gagal mengirim data ke server database.',
      },
      { status: 502 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Internal proxy error';
    return NextResponse.json(
      { success: false, error: 'PROXY_ERROR', message: msg },
      { status: 500 }
    );
  }
}
