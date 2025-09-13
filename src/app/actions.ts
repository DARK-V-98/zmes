
'use server';
import { auth, db, storage } from '@/lib/firebase';
import { doc, updateDoc, setDoc, collection, query, where, getDocs, or } from 'firebase/firestore';
import { getDownloadURL, ref, uploadString } from 'firebase/storage';
import type { User } from '@/lib/data';

export async function updateUserProfileUrl(userId: string, name: string, photoURL: string | null) {
  if (!userId) {
    throw new Error('You must be logged in to update your profile.');
  }
  try {
    const userDocRef = doc(db, 'users', userId);
    const updates: { displayName: string; photoURL?: string } = {
      displayName: name,
    };
    if (photoURL) {
      updates.photoURL = photoURL;
    }
    
    // Update Firestore document
    await updateDoc(userDocRef, updates);

    return { success: true, message: 'Profile updated successfully.' };

  } catch (error: any) {
    console.error('Error updating profile URL in Firestore:', error);
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
