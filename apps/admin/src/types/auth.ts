export interface AdminUser {
  id: string;
  email: string;
  isSuperAdmin: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSuccessResponse {
  user: AdminUser;
}

export interface AuthErrorResponse {
  error: string;
  message?: string;
}

export type AuthState =
  | { status: 'loading'; user: null; error: null }
  | { status: 'authenticated'; user: AdminUser; error: null }
  | { status: 'unauthenticated'; user: null; error: string | null };
