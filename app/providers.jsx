'use client';

import { AuthProvider } from '@/app/AuthContext';
import SmoothScroll from './SmoothScroll';

export default function Providers({ children }) {
  return (
    <AuthProvider>
      <div className="grain-overlay" />
      <div className="aurora-bg" />
      <SmoothScroll />
      {children}
    </AuthProvider>
  );
}
