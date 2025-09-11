import { ZMessenger } from '@/components/z-messenger';
import { loggedInUser, users, messages } from '@/lib/data';

export default function Home() {
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
