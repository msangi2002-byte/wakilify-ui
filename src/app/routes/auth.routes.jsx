import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '@/layouts/AuthLayout';
import { GuestOnly } from '@/app/guards/GuestOnly';

const Welcome = lazy(() => import('@/pages/auth/Welcome'));
const Register = lazy(() => import('@/pages/auth/Register'));
const Otp = lazy(() => import('@/pages/auth/Otp'));
const Login = lazy(() => import('@/pages/auth/Login'));

export function AuthRoutes() {
  return (
    <Route element={<GuestOnly><AuthLayout /></GuestOnly>}>
      <Route path="welcome" element={<Suspense fallback={null}><Welcome /></Suspense>} />
      <Route path="register" element={<Suspense fallback={null}><Register /></Suspense>} />
      <Route path="otp" element={<Suspense fallback={null}><Otp /></Suspense>} />
      <Route path="login" element={<Suspense fallback={null}><Login /></Suspense>} />
    </Route>
  );
}
