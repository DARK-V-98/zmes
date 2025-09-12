'use server';
import { getSmartReplySuggestions } from '@/ai/flows/smart-reply-suggestions';
import { auth, db, storage } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
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

export async function updateUserProfile(userId: string, formData: FormData) {
  const name = formData.get('name') as string;
  const image = formData.get('image') as string | null;

  if (!userId) {
    throw new Error('You must be logged in to update your profile.');
  }

  try {
    let photoURL: string | null = null;

    if (image) {
      const storageRef = ref(storage, `avatars/${userId}`);
      await uploadString(storageRef, image, 'data_url');
      photoURL = await getDownloadURL(storageRef);
    }
    
    // There's no server-side equivalent to update the auth profile with the client SDK
    // This part of the logic can only be successfully run on the client.
    // For a server action, we can only update the Firestore document.
    
    const userDocRef = doc(db, 'users', userId);
    const updates: { displayName: string; photoURL?: string } = {
      displayName: name,
    };
    if (photoURL) {
      updates.photoURL = photoURL;
    }
    await updateDoc(userDocRef, updates);

    // Note: To update auth.currentUser, this should be done client-side
    // or by using the Firebase Admin SDK for server-side operations.
    // The UI will reflect the change from Firestore's real-time updates.

    return { success: true, message: 'Profile updated successfully.' };

  } catch (error: any) {
    console.error('Error updating profile:', error);
    return { success: false, message: error.message };
  }
}

export async function updateChatBackground(userId: string, conversationId: string, image: string) {
  if (!userId) {
    throw new Error('You must be logged in to update the chat background.');
  }
  
  if (!image) {
    throw new Error('No image provided.');
  }

  try {
    const storageRef = ref(storage, `backgrounds/${conversationId}`);
    await uploadString(storageRef, image, 'data_url');
    const backgroundUrl = await getDownloadURL(storageRef);

    const conversationRef = doc(db, 'conversations', conversationId);
    await setDoc(conversationRef, { backgroundUrl }, { merge: true });

    return { success: true, message: 'Chat background updated successfully.' };
  } catch (error: any) {
    console.error('Error updating chat background:', error);
    return { success: false, message: error.message };
  }
}
