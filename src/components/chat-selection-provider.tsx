
'use client';

import type { User } from '@/lib/data';
import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ChatSelectionContextType {
  selectedUser: User | null;
  selectUser: (user: User | null) => void;
}

const ChatSelectionContext = createContext<ChatSelectionContextType | undefined>(undefined);

export function ChatSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const selectUser = (user: User | null) => {
    setSelectedUser(user);
  };

  return (
    <ChatSelectionContext.Provider value={{ selectedUser, selectUser }}>
      {children}
    </ChatSelectionContext.Provider>
  );
}

export const useChatSelection = () => {
  const context = useContext(ChatSelectionContext);
  if (context === undefined) {
    throw new Error('useChatSelection must be used within a ChatSelectionProvider');
  }
  return context;
};
