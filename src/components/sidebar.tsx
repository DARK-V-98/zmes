import React from 'react';
import type { Message, User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Search } from 'lucide-react';
import { Input } from './ui/input';

interface SidebarProps {
  users: User[];
  messages: Message[];
  loggedInUser: User;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
}

export function Sidebar({ users, messages, loggedInUser, selectedUser, onSelectUser }: SidebarProps) {
  const conversations = users.map(user => {
    const userMessages = messages
      .filter(m => (m.senderId === user.id && m.receiverId === loggedInUser.id) || (m.senderId === loggedInUser.id && m.receiverId === user.id))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const lastMessage = userMessages[0];
    const unreadCount = messages.filter(m => m.senderId === user.id && m.receiverId === loggedInUser.id && !m.read).length;

    return {
      user,
      lastMessage: lastMessage ? lastMessage.content : 'No messages yet',
      lastMessageTimestamp: lastMessage ? lastMessage.timestamp : new Date(0),
      unreadCount,
    };
  }).sort((a,b) => b.lastMessageTimestamp.getTime() - a.lastMessageTimestamp.getTime());

  return (
    <div className="w-full max-w-xs border-r flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold font-headline">Z Messenger</h1>
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Search" className="pl-10" />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.map(({ user, lastMessage, unreadCount }) => (
            <Button
              key={user.id}
              variant="ghost"
              className={cn(
                'w-full h-auto justify-start items-center p-3 text-left rounded-lg transition-colors',
                selectedUser?.id === user.id && 'bg-secondary'
              )}
              onClick={() => onSelectUser(user)}
            >
              <Avatar className="h-12 w-12 mr-4">
                <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="profile picture" />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="font-semibold truncate">{user.name}</p>
                <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
              </div>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground ml-2">{unreadCount}</Badge>
              )}
            </Button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
