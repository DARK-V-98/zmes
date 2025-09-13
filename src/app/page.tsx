
'use client';

import { ZMessenger } from '@/components/z-messenger';
import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import type { User } from '@/lib/data';
import Image from 'next/image';

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
          <Image
            src="/zm.png"
            alt="Z Messenger Logo"
            width={120}
            height={30}
            className="h-auto"
            priority
          />
        </div>
      </main>
    );
  }

  if (!user) {
    // This state will be brief before the redirect, but prevents rendering ZMessenger with a null user
    return null;
  }
  
  const loggedInUser: User = {
    id: user.uid,
    name: user.displayName || 'You',
    avatar: user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`,
  };

  return (
    <main className="h-screen bg-background text-foreground overflow-hidden">
       <div className="absolute inset-0">
        <ZMessenger
          loggedInUser={loggedInUser}
        />
      </div>
    </main>
  );
}
