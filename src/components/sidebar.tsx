import React, { useState } from 'react';
import type { Message, User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { MessageSquarePlus, Search } from 'lucide-react';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';

interface SidebarProps {
  users: User[];
  allUsers: User[];
  messages: Message[];
  loggedInUser: User;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
}

const NewChatDialog = ({ users, onSelectUser, open, setOpen }: { users: User[], onSelectUser: (user: User) => void; open: boolean, setOpen: (open: boolean) => void; }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <MessageSquarePlus />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a new chat</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
           <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name"
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <ScrollArea className="h-72">
            {filteredUsers.map(user => (
              <Button
                key={user.id}
                variant="ghost"
                className="w-full h-auto justify-start items-center p-3 text-left rounded-lg"
                onClick={() => {
                  onSelectUser(user);
                  setOpen(false);
                }}
              >
                <Avatar className="h-10 w-10 mr-4">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="font-semibold truncate">{user.name}</p>
              </Button>
            ))}
             {filteredUsers.length === 0 && (
              <div className="text-center text-muted-foreground py-10">
                No users found.
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}


export function Sidebar({ users, allUsers, messages, loggedInUser, selectedUser, onSelectUser }: SidebarProps) {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const otherUsers = allUsers.filter(u => u.id !== loggedInUser.id);

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
    <div className="w-full md:max-w-xs border-r flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h1 className="text-2xl font-bold font-headline">Z Messenger</h1>
        <NewChatDialog users={otherUsers} onSelectUser={onSelectUser} open={isNewChatOpen} setOpen={setIsNewChatOpen}/>
      </div>
       <div className="p-4 border-b">
        <div className="relative">
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
