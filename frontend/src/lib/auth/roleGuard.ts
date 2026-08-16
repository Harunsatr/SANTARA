// PROTOTYPE ONLY
// This session mechanism is NOT production authentication.
// Production authentication requires server-side authentication,
// password hashing, secure token/session management,
// authorization, and backend access control.

import { AppRole, PrototypeSession, SessionValidationResult } from '@/types/auth';
import { User, Student } from '@/types/models';

// ============================================================
// ROLE CONSTANTS — Exactly 3 canonical roles
// ============================================================

export const APP_ROLES: AppRole[] = ['ADMIN', 'KADER', 'SISWA'];

/**
 * Normalizes a raw role string from the database to one of the 3 canonical AppRole values.
 * Handles old DB values ('kader', 'admin', 'guru', 'siswa') and new capitalized values.
 * Maps 'guru'/'kader' to 'KADER' (Kader SATRIA).
 * Returns null if the role cannot be mapped to a valid AppRole.
 */
export function normalizeRole(rawRole: string): AppRole | null {
  const r = rawRole.trim().toLowerCase();
  if (r === 'admin' || r === 'kepala sekolah') return 'ADMIN';
  if (r === 'guru' || r === 'kader' || r === 'kader satria' || r === 'satria' || r === 'petugas_kesehatan') return 'KADER';
  if (r === 'siswa' || r === 'student') return 'SISWA';
  return null;
}

/**
 * Returns a human-readable label for the given AppRole.
 */
export function getRoleLabel(role: AppRole | string): string {
  const r = (role || '').trim().toLowerCase();
  if (r === 'admin') return 'Administrator';
  if (r === 'kader' || r === 'guru' || r === 'kader satria' || r === 'satria') return 'Kader SATRIA';
  if (r === 'siswa') return 'Siswa';
  return role || 'Pengguna';
}

// ============================================================
// AUTHORIZATION MATRIX
// ============================================================

/**
 * Route Authorization Matrix:
 *
 * /                → PUBLIC
 * /edukasi         → PUBLIC
 * /grafik          → PUBLIC
 * /login           → PUBLIC
 * /kader/*         → ADMIN + KADER (Kader SATRIA)
 * /admin/*         → ADMIN only
 * /siswa/*         → SISWA only
 */
export function canAccessRoute(
  user: PrototypeSession | User | null | undefined,
  pathname: string
): boolean {
  if (!user) return false;

  const rawRole = String(user.role || '').trim();
  const role = normalizeRole(rawRole);

  // Area kerja ADMIN + KADER
  if (pathname.startsWith('/kader')) {
    return role === 'ADMIN' || role === 'KADER' || (role as string) === 'GURU';
  }

  // Area eksklusif ADMIN
  if (pathname.startsWith('/admin')) {
    return role === 'ADMIN';
  }

  // Area eksklusif SISWA
  if (pathname.startsWith('/siswa')) {
    return role === 'SISWA';
  }

  // Public routes always accessible
  return true;
}

/**
 * Returns the default home route after login based on role.
 */
export function getDefaultRoute(role: AppRole | null): string {
  if (role === 'ADMIN' || role === 'KADER' || (role as string) === 'GURU') return '/kader/dashboard';
  if (role === 'SISWA') return '/siswa/dashboard';
  return '/login';
}

// ============================================================
// SESSION VALIDATION
// ============================================================

/**
 * Validates a raw JSON/object retrieved from localStorage.
 */
export function validateSessionObject(raw: unknown): SessionValidationResult {
  if (!raw) {
    return { isValid: false, reason: 'EMPTY' };
  }

  if (typeof raw !== 'object') {
    return { isValid: false, reason: 'CORRUPT' };
  }

  const obj = raw as Record<string, unknown>;

  const userId = String(obj.userId || obj.id || '').trim();
  const userName = String(obj.userName || obj.name || '').trim();
  const rawRole = String(obj.role || '').trim();
  const status = String(obj.status || 'active').trim().toLowerCase();

  // Required fields check
  if (!userId || !userName || !rawRole) {
    return { isValid: false, reason: 'MISSING_FIELDS' };
  }

  // Normalize to canonical role
  const normalizedRole = normalizeRole(rawRole);
  if (!normalizedRole) {
    // Role is not one of the 3 valid roles
    return { isValid: false, reason: 'UNAUTHORIZED_ROLE' };
  }

  // Active status check
  if (status === 'inactive' || status === 'non-active' || status === 'false') {
    return { isValid: false, reason: 'INACTIVE_USER' };
  }

  const email = obj.email ? String(obj.email).trim() : undefined;
  const schoolId = String(obj.schoolId || obj.school_id || '').trim() || undefined;
  const classId = String(obj.classId || obj.class_id || '').trim() || undefined;
  const studentId = obj.studentId ? String(obj.studentId).trim() || undefined : undefined;
  const createdAt = String(obj.createdAt || obj.created_at || new Date().toISOString()).trim();

  const normalizedSession: PrototypeSession = {
    userId,
    id: userId,
    userName,
    name: userName,
    email,
    role: normalizedRole,
    schoolId,
    school_id: schoolId,
    classId,
    class_id: classId,
    studentId,
    status: 'active',
    createdAt,
    created_at: createdAt,
  };

  return {
    isValid: true,
    session: normalizedSession,
  };
}

/**
 * Converts a database User model into a normalized PrototypeSession object.
 */
export function createSessionFromUser(user: User): PrototypeSession {
  const userId = user.id.trim();
  const userName = (user.name || 'Pengguna SANTARA').trim();
  const normalizedRole = normalizeRole(String(user.role || '')) || 'KADER';
  const now = new Date().toISOString();

  return {
    userId,
    id: userId,
    userName,
    name: userName,
    email: user.email ? user.email.trim() : undefined,
    role: normalizedRole,
    schoolId: user.school_id ? user.school_id.trim() : undefined,
    school_id: user.school_id ? user.school_id.trim() : undefined,
    classId: user.class_id ? user.class_id.trim() : undefined,
    class_id: user.class_id ? user.class_id.trim() : undefined,
    // studentId could be linked when SISWA role is supported with student_id field
    studentId: undefined,
    status: 'active',
    createdAt: now,
    created_at: now,
  };
}

/**
 * Converts a database Student model into a normalized PrototypeSession object for SISWA role.
 */
export function createSessionFromStudent(student: Student): PrototypeSession {
  const userId = student.id.trim();
  const userName = (student.nama || 'Siswa SANTARA').trim();
  const now = new Date().toISOString();

  return {
    userId,
    id: userId,
    userName,
    name: userName,
    role: 'SISWA',
    schoolId: student.school_id ? student.school_id.trim() : undefined,
    school_id: student.school_id ? student.school_id.trim() : undefined,
    classId: student.class_id ? student.class_id.trim() : undefined,
    class_id: student.class_id ? student.class_id.trim() : undefined,
    studentId: student.id.trim(),
    status: 'active',
    createdAt: now,
    created_at: now,
  };
}


/**
 * Filters users to active & inactive buckets. Replaces old filterActiveKaderUsers.
 */
export function filterActiveUsers(users: User[] = []): {
  activeUsers: User[];
  inactiveUsers: User[];
} {
  const activeUsers: User[] = [];
  const inactiveUsers: User[] = [];

  users.forEach(u => {
    const isIdValid = !!u.id && u.id.trim() !== '';
    const isNameValid = !!u.name && u.name.trim() !== '';
    const isRoleValid = !!u.role && normalizeRole(String(u.role)) !== null;
    const status = String(u.status || '').toLowerCase().trim();
    const isActive = status === 'active' || status === 'true';

    if (isIdValid && isNameValid && isRoleValid && isActive) {
      activeUsers.push(u);
    } else {
      inactiveUsers.push(u);
    }
  });

  return { activeUsers, inactiveUsers };
}

/**
 * @deprecated Use filterActiveUsers instead.
 */
export const filterActiveKaderUsers = filterActiveUsers;
