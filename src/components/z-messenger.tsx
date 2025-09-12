'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
} from 'firebase/firestore';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ZMessengerProps {
  loggedInUser: User;
}

const getConversationId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join('_');
};

export function ZMessenger({ loggedInUser }: ZMessengerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [view, setView] = useState<'sidebar' | 'chat'>('sidebar');
  const [isTyping, setIsTyping] = useState(false);

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


  // Fetch all users for starting new conversations
  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(usersQuery, (querySnapshot) => {
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
      
      // Update selected user with fresh data
      if (selectedUser) {
        const updatedSelectedUser = usersData.find(u => u.id === selectedUser.id);
        if (updatedSelectedUser) {
            setSelectedUser(updatedSelectedUser);
        }
      }
    });
    return () => unsubscribe();
  }, [selectedUser]);
  
  // Fetch messages for all conversations
  useEffect(() => {
    if (!loggedInUser.id) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', loggedInUser.id),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const batch = writeBatch(db);
      let hasUnread = false;

      const allMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        const message = {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate() ?? new Date(),
          reactions: data.reactions || [],
        } as Message;
        
        // Mark message as read
        if (selectedUser && data.receiverId === loggedInUser.id && data.senderId === selectedUser.id && !data.read) {
          batch.update(doc.ref, { read: true });
          hasUnread = true;
        }
        return message;
      });
      
      if (hasUnread) {
        batch.commit().catch(console.error);
      }

      setMessages(allMessages);

      const userIds = new Set<string>();
      allMessages.forEach(message => {
        const otherUserId = message.senderId === loggedInUser.id ? message.receiverId : message.senderId;
        userIds.add(otherUserId);
      });

      const conversationUsers = allUsers.filter(user => userIds.has(user.id));
      setConversations(conversationUsers);
      
      if (!isMobile && !selectedUser && conversationUsers.length > 0) {
            const lastMessageTimestamps: {[key: string]: number} = {};
            allMessages.forEach(msg => {
                const timestamp = msg.timestamp.getTime();
                const otherUserId = msg.senderId === loggedInUser.id ? msg.receiverId : msg.senderId;
                if (!lastMessageTimestamps[otherUserId] || timestamp > lastMessageTimestamps[otherUserId]) {
                    lastMessageTimestamps[otherUserId] = timestamp;
                }
            });

            const sortedConversations = [...conversationUsers].sort((a, b) => {
                const lastMessageA = lastMessageTimestamps[a.id] || 0;
                const lastMessageB = lastMessageTimestamps[b.id] || 0;
                return lastMessageB - lastMessageA;
            });

            if (sortedConversations.length > 0) {
              setSelectedUser(sortedConversations[0]);
            }
        }
    });


    return () => unsubscribe();
  }, [loggedInUser.id, allUsers, isMobile, selectedUser]);


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
    });
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

  useEffect(() => {
    if (!isMobile) {
      setView('chat');
    } else {
      setView('sidebar');
      setSelectedUser(null);
    }
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && selectedUser) {
      setView('chat');
    } else if (!selectedUser) {
      setView('sidebar');
    }
  }, [selectedUser, isMobile]);
  
  const otherUsers = allUsers.filter(u => u.id !== loggedInUser.id);
  
  const currentChatMessages = selectedUser 
    ? messages.filter(m => 
        (m.senderId === loggedInUser.id && m.receiverId === selectedUser.id) || 
        (m.senderId === selectedUser.id && m.receiverId === loggedInUser.id)
      ) 
    : [];

  if (isMobile) {
    return (
       <div className="h-full">
         <Card className="h-full flex rounded-none shadow-none border-0">
           {view === 'sidebar' ? (
             <Sidebar
               users={conversations}
               allUsers={otherUsers}
               messages={messages}
               loggedInUser={loggedInUser}
               selectedUser={selectedUser}
               onSelectUser={handleSelectUser}
             />
           ) : selectedUser ? (
             <Chat
               key={selectedUser.id}
               user={selectedUser}
               loggedInUser={loggedInUser}
               messages={currentChatMessages}
               onSendMessage={handleSendMessage}
               onBack={handleBackToSidebar}
               isMobile={isMobile}
               isTyping={isTyping}
               onTyping={handleTyping}
             />
           ) : (
            // Fallback for mobile when no user is selected but view is 'chat'
            <Sidebar
                users={conversations}
                allUsers={otherUsers}
                messages={messages}
                loggedInUser={loggedInUser}
                selectedUser={selectedUser}
                onSelectUser={handleSelectUser}
              />
           ) }
         </Card>
       </div>
    )
  }

  return (
    <div className="p-4 h-full">
      <Card className="h-full flex rounded-2xl shadow-lg">
        <Sidebar
          users={conversations}
          allUsers={otherUsers}
          messages={messages}
          loggedInUser={loggedInUser}
          selectedUser={selectedUser}
          onSelectUser={handleSelectUser}
        />
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <Chat
              key={selectedUser.id}
              user={selectedUser}
              loggedInUser={loggedInUser}
              messages={currentChatMessages}
              onSendMessage={handleSendMessage}
              isMobile={isMobile}
              isTyping={isTyping}
              onTyping={handleTyping}
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-card">
              <p>Select a conversation or start a new one</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
