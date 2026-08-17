// PROTOTYPE ONLY
// This session mechanism is NOT production authentication.
// Production authentication requires server-side authentication,
// password hashing, secure token/session management,
// authorization, and backend access control.

/**
 * SANTARA Application Role Enum
 * Primary 2 roles: KEPALA_SEKOLAH and KADER (with ADMIN alias).
 * Source of truth for all authorization logic.
 */
export type AppRole = 'KEPALA_SEKOLAH' | 'KADER' | 'ADMIN' | 'SISWA' | 'GURU';

/**
 * Standard typed Prototype Session object stored in localStorage
 */
export interface PrototypeSession {
  // Primary identifier
  userId: string;
  id: string; // Alias for backward compatibility

  // User profile
  userName: string;
  name: string; // Alias for backward compatibility
  email?: string;
  role: AppRole;

  // Scopes
  schoolId?: string;
  school_id?: string; // Alias for backward compatibility
  classId?: string;
  class_id?: string; // Alias for backward compatibility

  // SISWA-specific field
  studentId?: string; // Populated when role === 'SISWA'

  // Metadata
  status: string;
  createdAt: string;
  created_at: string; // Alias for backward compatibility
}

export interface SessionValidationResult {
  isValid: boolean;
  reason?: 'EMPTY' | 'CORRUPT' | 'MISSING_FIELDS' | 'INACTIVE_USER' | 'UNAUTHORIZED_ROLE';
  session?: PrototypeSession;
}
