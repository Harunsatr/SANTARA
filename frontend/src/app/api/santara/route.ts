import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_GAS_API_URL =
  'https://script.google.com/macros/s/AKfycby-x8OD8YHovfac2hf3R65WPGQYd1iR8lTDy06dafBzn9LFRPAjbEfYjZwiRzrE_AIayw/exec';

const GAS_API_URL =
  (process.env.SANTARA_SERVER_API_URL && process.env.SANTARA_SERVER_API_URL.trim() !== ''
    ? process.env.SANTARA_SERVER_API_URL.trim()
    : null) ||
  (process.env.NEXT_PUBLIC_SANTARA_API_URL && process.env.NEXT_PUBLIC_SANTARA_API_URL.trim() !== ''
    ? process.env.NEXT_PUBLIC_SANTARA_API_URL.trim()
    : null) ||
  DEFAULT_GAS_API_URL;

/**
 * Server-side Automatic Student Code Generator
 * Resolves class grade from 03_CLASSES and finds the next sequential letter for the grade
 * (e.g., 10_A, 10_B, 10_C -> 10_D; 11_A, 11_B -> 11_C; 12_A -> 12_B).
 */
async function resolveAndGenerateStudentCode(
  classId: string,
  schoolId: string,
  gasUrl: string
): Promise<string> {
  try {
    const cleanClassId = String(classId || '').trim();
    const cleanSchoolId = String(schoolId || 'SCH001').trim();

    // Fetch classes and students to find grade and used codes
    const [classesRes, studentsRes] = await Promise.all([
      fetch(`${gasUrl}?action=getClasses&school_id=${encodeURIComponent(cleanSchoolId)}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }).then(r => r.json()).catch(() => null),
      fetch(`${gasUrl}?action=getStudents&school_id=${encodeURIComponent(cleanSchoolId)}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      }).then(r => r.json()).catch(() => null),
    ]);

    let romanGrade = 'X';
    if (classesRes?.success && Array.isArray(classesRes.data)) {
      const cls = classesRes.data.find((c: { id?: unknown; grade?: unknown; class_name?: unknown }) => 
        String(c?.id || '').trim() === cleanClassId
      );
      if (cls) {
        const grStr = String(cls.grade || '').trim().toUpperCase();
        const nameStr = String(cls.class_name || '').trim().toUpperCase();
        if (grStr === '12' || grStr === 'XII' || grStr.includes('12') || grStr.includes('XII') || nameStr.includes('XII') || nameStr.includes('12')) {
          romanGrade = 'XII';
        } else if (grStr === '11' || grStr === 'XI' || grStr.includes('11') || grStr.includes('XI') || nameStr.includes('XI') || nameStr.includes('11')) {
          romanGrade = 'XI';
        } else {
          romanGrade = 'X';
        }
      }
    }

    const prefix = `${romanGrade}_`;
    const legacyNumericPrefix = romanGrade === 'X' ? '10_' : romanGrade === 'XI' ? '11_' : '12_';
    const usedLetters: string[] = [];

    if (studentsRes?.success && Array.isArray(studentsRes.data)) {
      studentsRes.data.forEach((s: { student_code?: unknown }) => {
        const code = String(s?.student_code || '').trim().toUpperCase();
        if (code.startsWith(prefix.toUpperCase())) {
          const suffix = code.substring(prefix.length).trim();
          if (suffix) usedLetters.push(suffix);
        } else if (code.startsWith(legacyNumericPrefix.toUpperCase())) {
          const suffix = code.substring(legacyNumericPrefix.length).trim();
          if (suffix) usedLetters.push(suffix);
        }
      });
    }

    function letterToIndex(str: string): number {
      let idx = 0;
      for (let i = 0; i < str.length; i++) {
        const charCode = str.charCodeAt(i);
        if (charCode >= 65 && charCode <= 90) {
          idx = idx * 26 + (charCode - 64);
        }
      }
      return idx - 1;
    }

    function indexToLetter(idx: number): string {
      let letter = '';
      let current = idx;
      while (current >= 0) {
        letter = String.fromCharCode((current % 26) + 65) + letter;
        current = Math.floor(current / 26) - 1;
      }
      return letter;
    }

    let maxIdx = -1;
    for (const suffix of usedLetters) {
      if (/^[A-Z]+$/.test(suffix)) {
        const idx = letterToIndex(suffix);
        if (idx > maxIdx) maxIdx = idx;
      } else if (/^\d+$/.test(suffix)) {
        const num = parseInt(suffix, 10);
        if (num > maxIdx + 1) maxIdx = num - 1;
      }
    }

    const nextLetter = indexToLetter(maxIdx + 1);
    return `${prefix}${nextLetter}`;
  } catch {
    return '10_A';
  }
}

/**
 * Server-side Proxy GET Handler
 * Bypasses browser CORS restrictions, adblockers, and 302 redirect issues.
 */
export async function GET(request: NextRequest) {
  if (!GAS_API_URL) {
    return NextResponse.json(
      { success: false, error: 'CONFIG_ERROR', message: 'Backend API URL is not configured' },
      { status: 500 }
    );
  }
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
  if (!GAS_API_URL) {
    return NextResponse.json(
      { success: false, error: 'CONFIG_ERROR', message: 'Backend API URL is not configured' },
      { status: 500 }
    );
  }
  try {
    const body = await request.json();

    // Server-side Automatic Student Code generation if not provided by client
    if (body && body.action === 'createStudent' && body.data) {
      if (!body.data.student_code || String(body.data.student_code).trim() === '') {
        const generatedCode = await resolveAndGenerateStudentCode(
          body.data.class_id,
          body.data.school_id || 'SCH001',
          GAS_API_URL
        );
        body.data.student_code = generatedCode;
      }
    }

    // Server-side Recalculation for Examinations (BMI and nutritional status)
    if (body && (body.action === 'createExamination' || body.action === 'updateExamination') && body.data) {
      const w = parseFloat(String(body.data.weight_kg || ''));
      const h = parseFloat(String(body.data.height_cm || ''));
      if (!isNaN(w) && w > 0 && !isNaN(h) && h > 0) {
        const hMeter = h / 100;
        const computedBmi = parseFloat((w / (hMeter * hMeter)).toFixed(2));
        body.data.bmi = computedBmi;

        if (!body.data.nutrional_status || String(body.data.nutrional_status).trim() === '') {
          if (computedBmi < 17.0) {
            body.data.nutrional_status = 'Gizi Buruk (Sangat Kurus)';
          } else if (computedBmi < 18.5) {
            body.data.nutrional_status = 'Kurus (Gizi Kurang)';
          } else if (computedBmi < 25.0) {
            body.data.nutrional_status = 'Gizi Baik (Normal)';
          } else if (computedBmi < 30.0) {
            body.data.nutrional_status = 'Gizi Lebih (Overweight)';
          } else {
            body.data.nutrional_status = 'Obesitas (Obese)';
          }
        }
      }
    }

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
