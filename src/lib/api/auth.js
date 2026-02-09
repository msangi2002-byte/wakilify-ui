import axios from 'axios';
import { api } from './client';
import { setAuth, getRefreshToken, getAuthUser } from '@/store/auth.store';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

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
  if (payload.region != null && payload.region !== '') body.region = payload.region;
  if (payload.country != null && payload.country !== '') body.country = payload.country;
  if (payload.dateOfBirth != null) body.dateOfBirth = payload.dateOfBirth;
  if (payload.interests != null && payload.interests !== '') body.interests = payload.interests;
  if (payload.referralCode != null && payload.referralCode !== '') body.referralCode = payload.referralCode;
  const { data } = await api.post('/auth/register', body);
  return data;
}

/**
 * POST /api/v1/auth/login
 * Request: { emailOrPhone, password }
 * Response: { success, message, data: { accessToken, refreshToken, user } }
 */
export async function login(payload) {
  const body = {
    emailOrPhone: payload.emailOrPhone,
    password: payload.password,
  };
  const { data } = await api.post('/auth/login', body);
  if (data?.data?.accessToken != null && data?.data?.user != null) {
    setAuth(data.data.user, data.data.accessToken, data.data.refreshToken ?? null);
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
 * POST /api/v1/auth/resend-otp
 * Request body: { phone }
 */
export async function resendOtp(phone) {
  const { data } = await api.post('/auth/resend-otp', { phone });
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
 * POST /api/v1/auth/refresh
 * Request: { refreshToken }
 * Response: { data: { accessToken, refreshToken? } } or { accessToken, refreshToken? }
 * Used by API client on 401 to get a new access token.
 */
export async function refreshTokens() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const { data } = await axios.post(`${baseURL}/auth/refresh`, { refreshToken }, {
    headers: { 'Content-Type': 'application/json' },
  });
  const accessToken = data?.data?.accessToken ?? data?.accessToken;
  const newRefresh = data?.data?.refreshToken ?? data?.refreshToken ?? refreshToken;
  if (accessToken) {
    setAuth(getAuthUser(), accessToken, newRefresh);
    return accessToken;
  }
  return null;
}

/**
 * POST /api/v1/auth/logout
 * Request body (route.txt): {}
 */
export async function logout() {
  await api.post('/auth/logout', {}).catch(() => {});
}
