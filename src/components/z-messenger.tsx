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

export function ZMessenger({ loggedInUser }: ZMessengerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [conversations, setConversations] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [view, setView] = useState<'sidebar' | 'chat'>('sidebar');

  // Fetch all users for starting new conversations
  useEffect(() => {
    const usersQuery = query(collection(db, 'users'), where('uid', '!=', loggedInUser.id));
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
  }, [loggedInUser.id]);
  
  // Fetch users with whom there are existing conversations
  useEffect(() => {
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
           setSelectedUser(conversationUsers[0]);
           setView('chat');
        }
    });

    return () => unsubscribe();
}, [loggedInUser.id, allUsers, selectedUser, isMobile]);


  // Fetch messages for the selected conversation
  useEffect(() => {
    if (!selectedUser) return;
    
    const messagesQuery = query(
      collection(db, 'messages'),
      where('senderId', 'in', [loggedInUser.id, selectedUser.id]),
      where('receiverId', 'in', [loggedInUser.id, selectedUser.id]),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
      const newMessages: Message[] = [];
      const batch = writeBatch(db);
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          (data.senderId === loggedInUser.id && data.receiverId === selectedUser.id) ||
          (data.senderId === selectedUser.id && data.receiverId === loggedInUser.id)
        ) {
           newMessages.push({
             id: doc.id,
             ...data,
             timestamp: (data.timestamp as Timestamp).toDate(),
             reactions: data.reactions || [],
           } as Message);

           // Mark message as read
           if (data.receiverId === loggedInUser.id && !data.read) {
              batch.update(doc.ref, { read: true });
           }
        }
      });
      
      batch.commit().catch(console.error);
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [selectedUser, loggedInUser.id]);


  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !selectedUser) return;

    await addDoc(collection(db, 'messages'), {
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
    setMessages([]);
    if (isMobile) {
      setView('chat');
    }
  }

  const handleBackToSidebar = () => {
    setView('sidebar');
    setSelectedUser(null);
  }

  if (isMobile) {
    return (
       <div className="h-full">
         <Card className="h-full flex rounded-none shadow-none border-0">
           {view === 'sidebar' ? (
             <Sidebar
               users={conversations}
               allUsers={allUsers}
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
           ) : null }
         </Card>
       </div>
    )
  }

  return (
    <div className="p-4 h-full">
      <Card className="h-full flex rounded-2xl shadow-lg">
        <Sidebar
          users={conversations}
          allUsers={allUsers}
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
