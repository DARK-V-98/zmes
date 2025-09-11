'use client';

import React, { useState } from 'react';
import type { Message, User } from '@/lib/data';
import { Sidebar } from '@/components/sidebar';
import { Chat } from '@/components/chat';
import { Card } from '@/components/ui/card';

interface ZMessengerProps {
  loggedInUser: User;
  users: User[];
  initialMessages: Message[];
}

export function ZMessenger({ loggedInUser, users, initialMessages }: ZMessengerProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [selectedUser, setSelectedUser] = useState<User>(users[0]);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;

    const newMessage: Message = {
      id: `msg${messages.length + 1}`,
      senderId: loggedInUser.id,
      receiverId: selectedUser.id,
      content,
      timestamp: new Date(),
      read: false,
      reactions: [],
    };

    setMessages([...messages, newMessage]);
  };

  return (
    <div className="p-4 h-full">
      <Card className="h-full flex rounded-2xl shadow-lg">
        <Sidebar
          users={users}
          messages={messages}
          loggedInUser={loggedInUser}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />
        <div className="flex-1 flex flex-col">
          <Chat
            key={selectedUser.id}
            user={selectedUser}
            loggedInUser={loggedInUser}
            messages={messages.filter(
              (m) =>
                (m.senderId === loggedInUser.id && m.receiverId === selectedUser.id) ||
                (m.senderId === selectedUser.id && m.receiverId === loggedInUser.id)
            )}
            onSendMessage={handleSendMessage}
          />
        </div>
      </Card>
    </div>
  );
}
