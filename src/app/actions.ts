'use server';
import { getSmartReplySuggestions } from '@/ai/flows/smart-reply-suggestions';
import { auth, db, storage } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';

export async function generateSmartReplies(message: string) {
  if (!message) return [];
  try {
    const replies = await getSmartReplySuggestions({ message });
    return replies;
  } catch (error) {
    console.error('Error generating smart replies:', error);
    return [];
  }
}

export async function updateUserProfile(formData: FormData) {
  const name = formData.get('name') as string;
  const image = formData.get('image') as string | null;

  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be logged in to update your profile.');
  }

  try {
    let photoURL = user.photoURL;

    if (image) {
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadString(storageRef, image, 'data_url');
      photoURL = await getDownloadURL(storageRef);
    }
    
    // Update Firebase Auth profile
    await updateProfile(user, {
      displayName: name,
      photoURL: photoURL,
    });
    
    // Update Firestore user document
    const userDocRef = doc(db, 'users', user.uid);
    await updateDoc(userDocRef, {
      displayName: name,
      photoURL: photoURL,
    });

    return { success: true, message: 'Profile updated successfully.' };

  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, message: error.message };
  }
}
