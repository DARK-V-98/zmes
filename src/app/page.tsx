
'use client';

import { ZMessenger } from '@/components/z-messenger';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Logo } from '@/components/logo';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <main className="h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse">
          <Logo size="xl" />
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="h-screen bg-background text-foreground overflow-hidden">
      <div className="absolute inset-0">
        <ZMessenger />
      </div>
    </main>
  );
}
