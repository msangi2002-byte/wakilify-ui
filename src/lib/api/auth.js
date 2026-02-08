import { api } from './client';
import { setAuth } from '@/store/auth.store';

// Auth API request/response shapes follow route.txt (Wakify API)

/**
 * POST /api/v1/auth/register
 * Request body (route.txt): { name, email?, phone?, password, role? }
 * Response: { success, message, data: { id, name, email, phone, role, isVerified, isActive, createdAt, updatedAt } }
 */
export async function register(payload) {
  const body = {
    name: payload.name,
    password: payload.password,
    role: payload.role ?? 'USER',
  };
  if (payload.email != null && payload.email !== '') body.email = payload.email;
  if (payload.phone != null && payload.phone !== '') body.phone = payload.phone;
  const { data } = await api.post('/auth/register', body);
  return data;
}

/**
 * POST /api/v1/auth/login
 * Request body (route.txt): { emailOrPhone, password }
 * Response: { success, message, data: { accessToken, refreshToken, user } }
 */
export async function login(payload) {
  const body = {
    emailOrPhone: payload.emailOrPhone,
    password: payload.password,
  };
  const { data } = await api.post('/auth/login', body);
  if (data?.data?.accessToken != null && data?.data?.user != null) {
    setAuth(data.data.user, data.data.accessToken);
  }
  return data;
}

/**
 * POST /api/v1/auth/verify-otp
 * Request body (route.txt): { phone, otp }
 */
export async function verifyOtp(payload) {
  const { data } = await api.post('/auth/verify-otp', {
    phone: payload.phone,
    otp: payload.otp,
  });
  return data;
}

/**
 * POST /api/v1/auth/forgot-password
 * Request body (route.txt): { phone }
 */
export async function forgotPassword(phone) {
  const { data } = await api.post('/auth/forgot-password', { phone });
  return data;
}

/**
 * POST /api/v1/auth/reset-password
 * Request body (route.txt): { phone, otp, newPassword }
 */
export async function resetPassword(payload) {
  const { data } = await api.post('/auth/reset-password', {
    phone: payload.phone,
    otp: payload.otp,
    newPassword: payload.newPassword,
  });
  return data;
}

/**
 * POST /api/v1/auth/logout
 * Request body (route.txt): {}
 */
export async function logout() {
  await api.post('/auth/logout', {}).catch(() => {});
}
