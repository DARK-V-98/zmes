
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { Message, User } from '@/lib/data';
import { Sidebar } from '@/components/sidebar';
import { Chat } from '@/components/chat';
import { Card } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  orderBy,
  doc,
  writeBatch,
  Timestamp,
  serverTimestamp,
  updateDoc,
  setDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  getDocs,
} from 'firebase/firestore';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from './auth-provider';

interface ZMessengerProps {
  loggedInUser: User;
}

const getConversationId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join('_');
};

export function ZMessenger({ loggedInUser: initialUser }: ZMessengerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [view, setView] = useState<'sidebar' | 'chat'>('sidebar');
  const [isTyping, setIsTyping] = useState(false);
  const { user: authUser } = useAuth();
  const [loggedInUser, setLoggedInUser] = useState(initialUser);
  const [searchTerm, setSearchTerm] = useState('');

  // Keep loggedInUser state in sync with AuthProvider and other users' state
  useEffect(() => {
    if (authUser) {
      const authUserData = allUsers.find(u => u.id === authUser.uid);
      const updatedUser = {
        id: authUser.uid,
        name: authUser.displayName || 'You',
        avatar: authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/200/200`,
        isOnline: authUserData?.isOnline,
      };
      setLoggedInUser(updatedUser);
    }
  }, [authUser, allUsers]);


  // User presence management
  useEffect(() => {
    if (!loggedInUser.id) return;
    const userRef = doc(db, 'users', loggedInUser.id);
    
    const updateUserPresence = (isOnline: boolean) => {
        setDoc(userRef, { isOnline, lastSeen: serverTimestamp() }, { merge: true });
    };

    updateUserPresence(true);

    const handleBeforeUnload = () => {
        updateUserPresence(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        updateUserPresence(false);
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loggedInUser.id]);


  // Fetch all users
  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          name: data.displayName || 'No Name',
          avatar: data.photoURL || `https://picsum.photos/seed/${doc.id}/200/200`,
          isOnline: data.isOnline,
        });
      });
      setAllUsers(usersData);
    });
     return () => unsubscribeUsers();
  }, []);

  // Update selectedUser when allUsers list changes
  useEffect(() => {
      if (selectedUser) {
        const updatedSelectedUser = allUsers.find(u => u.id === selectedUser.id);
        if (updatedSelectedUser) {
            setSelectedUser(updatedSelectedUser);
        }
      }
  }, [allUsers, selectedUser]);

  // Fetch all messages for the logged-in user
  useEffect(() => {
    if (!loggedInUser.id) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', loggedInUser.id),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate() ?? new Date(),
          reactions: data.reactions || [],
          deletedFor: data.deletedFor || [],
        } as Message;
      });
      setMessages(allMessages);
    });

    return () => unsubscribeMessages();
  }, [loggedInUser.id]);


  const conversations = useMemo(() => {
    const userIdsInConversations = new Set<string>();
    messages.forEach(message => {
        if (!message.deletedFor?.includes(loggedInUser.id)) {
            const otherUserId = message.senderId === loggedInUser.id ? message.receiverId : message.senderId;
            userIdsInConversations.add(otherUserId);
        }
    });

    return allUsers.filter(user => userIdsInConversations.has(user.id));
  }, [messages, allUsers, loggedInUser.id]);

  // Set initial user on desktop
  useEffect(() => {
    if (!isMobile && !selectedUser && conversations.length > 0) {
        const lastMessageTimestamps: {[key: string]: number} = {};
        messages.forEach(msg => {
            if (!msg.deletedFor?.includes(loggedInUser.id)) {
              const timestamp = msg.timestamp.getTime();
              const otherUserId = msg.senderId === loggedInUser.id ? msg.receiverId : msg.senderId;
              if (!lastMessageTimestamps[otherUserId] || timestamp > lastMessageTimestamps[otherUserId]) {
                  lastMessageTimestamps[otherUserId] = timestamp;
              }
            }
        });

        const sortedConversations = [...conversations].sort((a, b) => {
            const lastMessageA = lastMessageTimestamps[a.id] || 0;
            const lastMessageB = lastMessageTimestamps[b.id] || 0;
            return lastMessageB - lastMessageA;
        });

        if (sortedConversations.length > 0) {
          setSelectedUser(sortedConversations[0]);
        }
    }
  }, [conversations, isMobile, messages, loggedInUser.id, selectedUser]);


  // Mark messages as read
  useEffect(() => {
    if (!selectedUser || !loggedInUser.id) return;

    const unreadMessages = messages.filter(m => 
        m.receiverId === loggedInUser.id && 
        m.senderId === selectedUser.id && 
        !m.read
    );

    if (unreadMessages.length > 0) {
        const batch = writeBatch(db);
        unreadMessages.forEach(message => {
            const messageRef = doc(db, 'messages', message.id);
            batch.update(messageRef, { read: true });
        });
        batch.commit().catch(console.error);
    }
  }, [selectedUser, messages, loggedInUser.id]);


  // Typing status management
  useEffect(() => {
    if (!selectedUser || !loggedInUser.id) return;
    const conversationId = getConversationId(loggedInUser.id, selectedUser.id);
    const conversationRef = doc(db, 'conversations', conversationId);

    const unsubscribe = onSnapshot(conversationRef, (doc) => {
      const data = doc.data();
      if (data && data.typing) {
        setIsTyping(data.typing[selectedUser.id] || false);
      } else {
        setIsTyping(false);
      }
    });

    return () => unsubscribe();
  }, [selectedUser, loggedInUser.id]);


  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !selectedUser) return;

    const conversationId = getConversationId(loggedInUser.id, selectedUser.id);
    await addDoc(collection(db, 'messages'), {
      conversationId,
      senderId: loggedInUser.id,
      receiverId: selectedUser.id,
      participants: [loggedInUser.id, selectedUser.id],
      content,
      timestamp: serverTimestamp(),
      read: false,
      reactions: [],
      deletedFor: [],
    });
  };

  const handleUpdateReaction = async (messageId: string, emoji: string) => {
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    if (!messageDoc.exists()) return;
  
    const messageData = messageDoc.data();
    const existingReactions = (messageData.reactions || []) as {emoji: string; userId: string}[];
    const myReaction = existingReactions.find(r => r.userId === loggedInUser.id);
  
    if (myReaction) {
      if (myReaction.emoji === emoji) {
        await updateDoc(messageRef, {
          reactions: arrayRemove(myReaction),
        });
      } else {
        await updateDoc(messageRef, {
          reactions: arrayRemove(myReaction),
        });
        await updateDoc(messageRef, {
          reactions: arrayUnion({ emoji, userId: loggedInUser.id }),
        });
      }
    } else {
      await updateDoc(messageRef, {
        reactions: arrayUnion({ emoji, userId: loggedInUser.id }),
      });
    }
  };

  const handleClearHistory = async (otherUserId: string) => {
    const conversationId = getConversationId(loggedInUser.id, otherUserId);
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId)
    );

    const querySnapshot = await getDocs(messagesQuery);
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
      batch.update(doc.ref, {
        deletedFor: arrayUnion(loggedInUser.id)
      });
    });
    await batch.commit();

    if (selectedUser?.id === otherUserId) {
        setSelectedUser(null);
    }
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!selectedUser) return;
    const conversationId = getConversationId(loggedInUser.id, selectedUser.id);
    const conversationRef = doc(db, 'conversations', conversationId);
    try {
        await setDoc(conversationRef, {
            typing: {
                [loggedInUser.id]: isTyping
            }
        }, { merge: true });
    } catch (error) {
       console.error("Error updating typing status:", error)
    }
  }
  
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    if (isMobile) {
      setView('chat');
    }
  }

  const handleBackToSidebar = () => {
    setView('sidebar');
    setSelectedUser(null);
  }

  // Effect to manage view state on mobile
  useEffect(() => {
    if (isMobile) {
      setView(selectedUser ? 'chat' : 'sidebar');
    } else {
      setView('chat'); 
    }
  }, [selectedUser, isMobile]);

  
  const otherUsers = allUsers.filter(u => u.id !== loggedInUser.id);
  
  const currentChatMessages = selectedUser 
    ? messages.filter(m => m.conversationId === getConversationId(loggedInUser.id, selectedUser.id)) 
    : [];

  if (isMobile) {
    return (
       <div className="h-full">
         <Card className="h-full flex rounded-none shadow-none border-0">
           {view === 'sidebar' && (
             <Sidebar
               conversations={conversations}
               allUsers={otherUsers}
               messages={messages}
               loggedInUser={loggedInUser}
               selectedUser={selectedUser}
               onSelectUser={handleSelectUser}
               onClearHistory={handleClearHistory}
               searchTerm={searchTerm}
               onSearchTermChange={setSearchTerm}
             />
           )}
           {view === 'chat' && selectedUser && (
             <Chat
               key={selectedUser.id}
               user={selectedUser}
               loggedInUser={loggedInUser}
               messages={currentChatMessages}
               onSendMessage={handleSendMessage}
               onUpdateReaction={handleUpdateReaction}
               onClearHistory={handleClearHistory}
               onBack={handleBackToSidebar}
               isMobile={isMobile}
               isTyping={isTyping}
               onTyping={handleTyping}
             />
           )}
         </Card>
       </div>
    )
  }

  return (
    <div className="p-4 h-full">
      <Card className="h-full flex rounded-2xl shadow-lg">
        <Sidebar
          conversations={conversations}
          allUsers={otherUsers}
          messages={messages}
          loggedInUser={loggedInUser}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
          onClearHistory={handleClearHistory}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
        />
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <Chat
              key={selectedUser.id}
              user={selectedUser}
              loggedInUser={loggedInUser}
              messages={currentChatMessages}
              onSendMessage={handleSendMessage}
              onUpdateReaction={handleUpdateReaction}
              onClearHistory={handleClearHistory}
              isMobile={isMobile}
              isTyping={isTyping}
              onTyping={handleTyping}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-card">
              <p className="text-muted-foreground">Select a conversation or start a new one</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
