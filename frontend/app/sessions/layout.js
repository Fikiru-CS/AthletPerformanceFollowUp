'use client';
// app/sessions/layout.js
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/AuthContext';
import Sidebar from '../../components/layout/Sidebar';

export default function SessionsLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login');
  }, [user, loading, router]);

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--bg)' }}>
      <div className="spinner" />
    </div>
  );

  if (!user) return null;

  return (
    <div className="page-wrapper">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
