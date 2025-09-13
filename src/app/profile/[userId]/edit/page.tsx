
'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import type { User } from '@/lib/data';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/app/actions';
import { ArrowLeft, Camera, Facebook, Instagram, Link as LinkIcon, PlusCircle, Trash2, Twitter } from 'lucide-react';
import Image from 'next/image';

// This function is required for static exports with dynamic routes.
// We return an empty array because we don't want to pre-render any pages at build time.
// The edit page will be rendered dynamically on the client side.
export async function generateStaticParams() {
    return [];
}

type SocialLink = { type: 'facebook' | 'instagram' | 'twitter' | 'website'; url: string };

// Helper function to upload an image and get the URL
const uploadImage = async (fileDataUrl: string, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const match = fileDataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) {
        throw new Error('Invalid image data URI');
    }
    const contentType = match[1];
    await uploadString(storageRef, fileDataUrl, 'data_url', { contentType });
    return getDownloadURL(storageRef);
};


export default function EditProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const router = useRouter();
    const { user: authUser, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [user, setUser] = useState<User | null>(null);
    const [name, setName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
    
    const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
    const [profileImageData, setProfileImageData] = useState<string | null>(null);
    const profileFileInputRef = useRef<HTMLInputElement>(null);

    const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
    const [coverImageData, setCoverImageData] = useState<string | null>(null);
    const coverFileInputRef = useRef<HTMLInputElement>(null);
    
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        const userDocRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const fetchedUser: User = {
                    id: docSnap.id,
                    name: data.displayName,
                    avatar: data.photoURL,
                    email: data.email,
                    coverPhotoURL: data.coverPhotoURL,
                    phoneNumber: data.phoneNumber,
                    socialLinks: data.socialLinks || [],
                };
                setUser(fetchedUser);
                setName(fetchedUser.name);
                setPhoneNumber(fetchedUser.phoneNumber || '');
                setSocialLinks(fetchedUser.socialLinks || []);
                setProfileImagePreview(fetchedUser.avatar);
                setCoverImagePreview(fetchedUser.coverPhotoURL || null);
            }
            setPageLoading(false);
        });
        return () => unsubscribe();
    }, [userId]);

    // Protect route
    useEffect(() => {
        if (!authLoading && authUser?.uid !== userId) {
            router.push(`/profile/${userId}`);
        }
    }, [authUser, userId, authLoading, router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                if (type === 'profile') {
                    setProfileImagePreview(result);
                    setProfileImageData(result);
                } else {
                    setCoverImagePreview(result);
                    setCoverImageData(result);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSocialLinkChange = (index: number, field: 'type' | 'url', value: string) => {
        const newLinks = [...socialLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setSocialLinks(newLinks);
    };

    const addSocialLink = () => {
        setSocialLinks([...socialLinks, { type: 'website', url: '' }]);
    };

    const removeSocialLink = (index: number) => {
        setSocialLinks(socialLinks.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        
        try {
            const updates: Partial<User> = {};

            // Upload images first and get URLs
            if (profileImageData) {
                updates.avatar = await uploadImage(profileImageData, `avatars/${user.id}`);
            }
            if (coverImageData) {
                updates.coverPhotoURL = await uploadImage(coverImageData, `cover_photos/${user.id}`);
            }

            // Prepare other text-based updates
            if (name !== user.name) updates.name = name;
            if (phoneNumber !== user.phoneNumber) updates.phoneNumber = phoneNumber;
            if (JSON.stringify(socialLinks) !== JSON.stringify(user.socialLinks || [])) updates.socialLinks = socialLinks;
            
            if (Object.keys(updates).length === 0) {
                toast({ title: 'No changes to save.' });
                setLoading(false);
                return;
            }

            const result = await updateUserProfile(user.id, updates);
            if (result.success) {
                toast({ title: 'Success', description: 'Profile updated successfully.' });
                router.push(`/profile/${user.id}`);
            } else {
                throw new Error(result.message);
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    if (pageLoading || authLoading) {
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
                <Button onClick={() => router.push('/')} className="mt-4">Go Home</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary/50 p-4 sm:p-6 lg:p-8">
            <div className="absolute top-4 left-4 z-10">
                <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft />
                </Button>
            </div>
            <div className="max-w-3xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Edit Profile</CardTitle>
                        <CardDescription>Make changes to your public profile.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Cover Photo */}
                            <div className="space-y-2">
                                <Label>Cover Photo</Label>
                                <div className="relative w-full h-48 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
                                    {coverImagePreview && (
                                        <Image src={coverImagePreview} alt="Cover preview" layout="fill" objectFit="cover" />
                                    )}
                                     <Button
                                        type="button"
                                        size="icon"
                                        className="absolute z-10 rounded-full h-10 w-10"
                                        onClick={() => coverFileInputRef.current?.click()}
                                    >
                                        <Camera className="h-5 w-5" />
                                    </Button>
                                    <input type="file" ref={coverFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'cover')} />
                                </div>
                            </div>
                            
                            {/* Profile Photo & Name */}
                             <div className="flex flex-col sm:flex-row items-center gap-6">
                                 <div className="relative">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={profileImagePreview || undefined} />
                                        <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                     <Button
                                        type="button"
                                        size="icon"
                                        className="absolute bottom-0 right-0 rounded-full h-8 w-8"
                                        onClick={() => profileFileInputRef.current?.click()}
                                    >
                                        <Camera className="h-4 w-4" />
                                    </Button>
                                    <input type="file" ref={profileFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageChange(e, 'profile')} />
                                 </div>
                                 <div className="space-y-2 flex-1 w-full">
                                    <Label htmlFor="name">Name</Label>
                                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                                </div>
                             </div>

                             {/* Phone Number */}
                             <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number (optional)</Label>
                                <Input id="phone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+1 (555) 123-4567"/>
                             </div>

                             {/* Social Links */}
                             <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Social Links</Label>
                                    <Button type="button" variant="ghost" size="sm" onClick={addSocialLink}>
                                        <PlusCircle className="mr-2 h-4 w-4"/> Add Link
                                    </Button>
                                </div>
                                {socialLinks.map((link, index) => (
                                    <div key={index} className="flex items-center gap-2">
                                        <div className="relative w-12">
                                            {link.type === 'facebook' && <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
                                            {link.type === 'instagram' && <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
                                            {link.type === 'twitter' && <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
                                            {link.type === 'website' && <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
                                        </div>
                                        {/* This should be a select, but for simplicity, we'll use text for now */}
                                        <Input value={link.type} disabled className="w-32"/>
                                        <Input 
                                            value={link.url}
                                            onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                                            placeholder="https://example.com"
                                        />
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSocialLink(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive"/>
                                        </Button>
                                    </div>
                                ))}
                             </div>

                             <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : 'Save Changes'}
                                </Button>
                             </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

    