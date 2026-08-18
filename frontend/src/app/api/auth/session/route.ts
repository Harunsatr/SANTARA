import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'santara_session';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds

/**
 * GET /api/auth/session
 * Reads the session cookie and returns the active user session.
 */
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(COOKIE_NAME);

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json(
        { success: false, data: null, message: 'No active session cookie found' },
        { status: 200 }
      );
    }

    let sessionData;
    try {
      sessionData = JSON.parse(decodeURIComponent(sessionCookie.value));
    } catch {
      sessionData = JSON.parse(sessionCookie.value);
    }

    return NextResponse.json({
      success: true,
      data: sessionData,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, data: null, error: error instanceof Error ? error.message : 'Invalid session' },
      { status: 200 }
    );
  }
}

/**
 * POST /api/auth/session
 * Sets the persistent session cookie upon successful login.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = body?.session;

    if (!session || !session.userId || !session.role) {
      return NextResponse.json(
        { success: false, message: 'Invalid session payload' },
        { status: 400 }
      );
    }

    const serialized = encodeURIComponent(JSON.stringify(session));
    const isProduction = process.env.NODE_ENV === 'production';

    const response = NextResponse.json({
      success: true,
      message: 'Session cookie successfully established',
      data: session,
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: serialized,
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      httpOnly: false, // Allows isomorphic sync with client while persisting across reloads/tabs
      secure: isProduction,
    });

    // Also set a secure server-only companion cookie for added security
    response.cookies.set({
      name: 'santara_auth_token',
      value: `${session.userId}:${session.role}:${Date.now()}`,
      path: '/',
      maxAge: COOKIE_MAX_AGE,
      sameSite: 'lax',
      httpOnly: true,
      secure: isProduction,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to set session cookie' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/session
 * Clears the session cookies on logout.
 */
export async function DELETE() {
  const response = NextResponse.json({
    success: true,
    message: 'Session cookie successfully removed',
  });

  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  });

  response.cookies.set({
    name: 'santara_auth_token',
    value: '',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
    httpOnly: true,
  });

  return response;
}
