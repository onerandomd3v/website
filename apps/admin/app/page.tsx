'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../src/context/auth-context';

export default function AdminHome() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard');
    } else if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [status, router]);

  return (
    <main
      style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}
    >
      <p role="status">Directing to CodedDevs Admin...</p>
    </main>
  );
}
