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
  getDocs,
  Timestamp,
  or,
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
        });
      });
      setAllUsers(usersData);
    });
    return () => unsubscribe();
  }, []);
  
  // Fetch users with whom there are existing conversations
  useEffect(() => {
    if (!loggedInUser.id || allUsers.length === 0) return;

    const messagesQuery = query(
        collection(db, "messages"),
        or(
            where("senderId", "==", loggedInUser.id),
            where("receiverId", "==", loggedInUser.id)
        )
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
        const userIds = new Set<string>();
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.senderId === loggedInUser.id) {
                userIds.add(data.receiverId);
            } else {
                userIds.add(data.senderId);
            }
        });

        const conversationUsers = allUsers.filter(user => userIds.has(user.id));
        setConversations(conversationUsers);
        
        if (!isMobile && !selectedUser && conversationUsers.length > 0) {
            // Find the user object corresponding to the latest message and select them.
            const sortedConversations = conversationUsers.sort((a, b) => {
                const lastMessageA = messages.filter(m => m.senderId === a.id || m.receiverId === a.id).pop()?.timestamp || 0;
                const lastMessageB = messages.filter(m => m.senderId === b.id || m.receiverId === b.id).pop()?.timestamp || 0;
                return (lastMessageB as number) - (lastMessageA as number);
            });
            if (sortedConversations.length > 0) {
              setSelectedUser(sortedConversations[0]);
            }
        }
    });

    return () => unsubscribe();
}, [loggedInUser.id, allUsers, isMobile]);


  // Fetch messages for the selected conversation
  useEffect(() => {
    if (!selectedUser || !loggedInUser.id) {
        setMessages([]);
        return;
    };
    
    const conversationId = getConversationId(loggedInUser.id, selectedUser.id);
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const newMessages: Message[] = [];
      const batch = writeBatch(db);
      let hasUnread = false;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newMessages.push({
           id: doc.id,
           ...data,
           timestamp: (data.timestamp as Timestamp).toDate(),
           reactions: data.reactions || [],
         } as Message);

         // Mark message as read
         if (data.receiverId === loggedInUser.id && !data.read) {
            batch.update(doc.ref, { read: true });
            hasUnread = true;
         }
      });
      
      if (hasUnread) {
        batch.commit().catch(console.error);
      }
      setMessages(newMessages);
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
      content,
      timestamp: new Date(),
      read: false,
      reactions: [],
    });
  };
  
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
               messages={messages}
               onSendMessage={handleSendMessage}
               onBack={handleBackToSidebar}
               isMobile={isMobile}
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
              messages={messages}
              onSendMessage={handleSendMessage}
              isMobile={isMobile}
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
