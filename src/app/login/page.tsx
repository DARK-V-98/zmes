
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Separator } from '@/components/ui/separator';
import { Logo } from '@/components/logo';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
    {...props}
  >
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.655-3.373-11.303-7.918l-6.573,4.819C9.656,39.663,16.318,44,24,44z"
    />
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C39.986,36.579,44,30.836,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />
  </svg>
);


export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, 'users', user.uid);
      const role = user.email === 'tikfese@gmail.com' ? 'developer' : 'user';
      await setDoc(userDocRef, { isOnline: true, lastSeen: serverTimestamp(), role }, { merge: true });
      router.push('/');
    } catch (error: any) {
      const errorMessage =
        error.code === 'auth/invalid-credential'
          ? 'Invalid email or password.'
          : error.message;
      setError(errorMessage);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const role = user.email === 'tikfese@gmail.com' ? 'developer' : 'user';

      if (!userDoc.exists()) {
         await setDoc(userDocRef, {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            isOnline: true,
            lastSeen: serverTimestamp(),
            role: role,
          });
      } else {
        const updates: { [key: string]: any } = {
            isOnline: true,
            lastSeen: serverTimestamp(),
            role: role,
        };
        const userData = userDoc.data();
        if (userData.displayName !== user.displayName) {
            updates.displayName = user.displayName!;
        }
        if (userData.photoURL !== user.photoURL) {
            updates.photoURL = user.photoURL!;
        }
        await updateDoc(userDocRef, updates);
      }

      router.push('/');
    } catch (error: any) {
        setError(error.message);
        toast({
            variant: 'destructive',
            title: 'Google Sign-In Failed',
            description: error.message,
        });
    } finally {
        setGoogleLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-2">
            <Logo size="lg" />
            <h1 className="text-2xl font-bold">Z Messenger</h1>
        </div>
        <Card className="w-full max-w-sm">
            <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>Enter your credentials to access your account.</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="space-y-4">
                <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    />
                </div>
                <Button type="submit" className="w-full" disabled={loading || googleLoading}>
                    {loading ? 'Logging in...' : 'Login'}
                </Button>
                </form>
                <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
                </div>

                <Button variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={loading || googleLoading}>
                {googleLoading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
                ) : (
                    <>
                    <GoogleIcon className="mr-2" />
                    Google
                    </>
                )}
                </Button>
                <div className="text-center text-sm">
                Don't have an account?{' '}
                <Link href="/signup" className="underline">
                    Sign up
                </Link>
                </div>
            </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
