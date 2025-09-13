'use server';
import { auth, db, storage } from '@/lib/firebase';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, setDoc, collection, query, where, getDocs, or } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import type { User } from '@/lib/data';

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

export async function searchUsers(searchTerm: string, currentUserId: string): Promise<User[]> {
  if (!searchTerm.trim()) {
    return [];
  }

  const usersRef = collection(db, 'users');
  // Firestore doesn't support case-insensitive queries directly, 
  // so we query for exact match for now. A more robust solution might involve
  // storing a normalized (e.g., lowercase) version of the name and email.
  const q = query(usersRef, 
    or(
      where('displayName', '==', searchTerm),
      where('email', '==', searchTerm)
    )
  );

  try {
    const querySnapshot = await getDocs(q);
    const users: User[] = [];
    querySnapshot.forEach((doc) => {
      // Exclude the current user from search results
      if (doc.id !== currentUserId) {
        const data = doc.data();
        users.push({
          id: doc.id,
          name: data.displayName,
          avatar: data.photoURL,
          email: data.email,
        });
      }
    });
    return users;
  } catch (error) {
    console.error("Error searching users:", error);
    return [];
  }
}


export async function updateMessage(messageId: string, newContent: string) {
  if (!messageId || !newContent.trim()) {
    throw new Error('Invalid input');
  }
  const messageRef = doc(db, 'messages', messageId);
  await updateDoc(messageRef, {
    content: newContent,
  });
}

export async function deleteMessage(messageId: string) {
  if (!messageId) {
    throw new Error('Invalid input');
  }
  const messageRef = doc(db, 'messages', messageId);
  await updateDoc(messageRef, {
    content: 'This message was deleted',
    isDeleted: true,
  });
}
