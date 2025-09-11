'use client';

import { ZMessenger } from '@/components/z-messenger';
import { users, messages } from '@/lib/data';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { User } from '@/lib/data';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <main className="h-screen bg-background text-foreground flex items-center justify-center">
        <p>Loading...</p>
      </main>
    );
  }
  
  const loggedInUser: User = {
    id: user.uid,
    name: user.displayName || 'You',
    avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
  };

  return (
    <main className="h-screen bg-background text-foreground overflow-hidden">
      <ZMessenger
        loggedInUser={loggedInUser}
        users={users}
        initialMessages={messages}
      />
    </main>
  );
}
