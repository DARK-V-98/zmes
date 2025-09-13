
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, Facebook, Instagram, Link as LinkIcon, Mail, Phone, Twitter } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';

const SocialIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'facebook': return <Facebook className="h-5 w-5" />;
        case 'instagram': return <Instagram className="h-5 w-5" />;
        case 'twitter': return <Twitter className="h-5 w-5" />;
        case 'website': return <LinkIcon className="h-5 w-5" />;
        default: return <LinkIcon className="h-5 w-5" />;
    }
};

export default function ProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user: authUser } = useAuth();

    useEffect(() => {
        if (!userId) return;

        const userDocRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setUser({
                    id: docSnap.id,
                    name: data.displayName,
                    avatar: data.photoURL,
                    email: data.email,
                    isOnline: data.isOnline,
                    coverPhotoURL: data.coverPhotoURL,
                    phoneNumber: data.phoneNumber,
                    socialLinks: data.socialLinks,
                });
            } else {
                console.log("No such user!");
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background">
                <p className="text-xl text-muted-foreground">User not found.</p>
                <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
        );
    }
    
    const isOwner = authUser?.uid === userId;

    return (
        <div className="min-h-screen bg-secondary/50">
            <div className="absolute top-4 left-4 z-10">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
            </div>
            {isOwner && (
                 <div className="absolute top-4 right-4 z-10">
                    <Button asChild variant="outline">
                        <Link href={`/profile/${userId}/edit`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Profile
                        </Link>
                    </Button>
                </div>
            )}
            <div className="w-full max-w-4xl mx-auto">
                <Card className="overflow-hidden shadow-lg">
                    <div className="relative h-48 md:h-64 bg-muted">
                        {user.coverPhotoURL ? (
                            <Image src={user.coverPhotoURL} alt="Cover photo" layout="fill" objectFit="cover" />
                        ) : (
                            <div className="h-full bg-gradient-to-r from-primary/20 to-accent/20"></div>
                        )}
                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2">
                            <Avatar className="h-32 w-32 border-4 border-background ring-4 ring-primary">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="text-4xl">{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    
                    <div className="pt-20 pb-8 px-6 text-center">
                        <h1 className="text-3xl font-bold">{user.name}</h1>
                        <div className="flex items-center justify-center gap-2 mt-2">
                             <span className={cn("h-3 w-3 rounded-full", user.isOnline ? "bg-accent" : "bg-gray-400")}></span>
                             <p className="text-muted-foreground">{user.isOnline ? 'Online' : 'Offline'}</p>
                        </div>
                    </div>

                    <div className="border-t p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-4">
                                <h2 className="font-semibold text-lg border-b pb-2">Contact Information</h2>
                                <div className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-muted-foreground"/>
                                    <span>{user.email || 'No email provided'}</span>
                                </div>
                                 {user.phoneNumber && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="h-5 w-5 text-muted-foreground"/>
                                        <span>{user.phoneNumber}</span>
                                    </div>
                                )}
                            </div>
                            {user.socialLinks && user.socialLinks.length > 0 && (
                                <div className="space-y-4">
                                    <h2 className="font-semibold text-lg border-b pb-2">Social Links</h2>
                                    {user.socialLinks.map((link, index) => (
                                        <a key={index} href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-primary hover:underline">
                                           <SocialIcon type={link.type} />
                                            <span className="truncate">{link.url.replace(/^https?:\/\//, '')}</span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
