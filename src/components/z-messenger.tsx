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
  getDocs,
  Timestamp,
} from 'firebase/firestore';

interface ZMessengerProps {
  loggedInUser: User;
}

export function ZMessenger({ loggedInUser }: ZMessengerProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

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
      setUsers(usersData);
      if (!selectedUser && usersData.length > 0) {
        setSelectedUser(usersData[0]);
      }
    });
    return () => unsubscribe();
  }, [loggedInUser.id, selectedUser]);
  
  useEffect(() => {
    if (!selectedUser) return;

    const q = query(
        collection(db, 'messages'),
        orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const newMessages: Message[] = [];
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
            }
        });
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
    setMessages([]); // Clear messages while new ones are loading
  }

  return (
    <div className="p-4 h-full">
      <Card className="h-full flex rounded-2xl shadow-lg">
        <Sidebar
          users={users}
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
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-card">
              <p>Select a user to start chatting</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
