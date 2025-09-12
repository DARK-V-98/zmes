import React, { useState, useRef } from 'react';
import type { Message, User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { MessageSquarePlus, Search, Download, Settings, Camera, LogOut, User as UserIcon, Smile, Trash2 } from 'lucide-react';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { usePWAInstall } from './pwa-install-provider';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from './ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Label } from './ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/app/actions';
import Image from 'next/image';
import { Mood, useMood } from './mood-provider';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SidebarProps {
  users: User[];
  allUsers: User[];
  messages: Message[];
  loggedInUser: User;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onClearHistory: (userId: string) => void;
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
                <Avatar className="h-10 w-10 mr-4 relative">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-accent ring-2 ring-background"></div>
                  )}
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

const ProfileSettingsDialog = ({ user, open, setOpen }: { user: User; open: boolean, setOpen: (open: boolean) => void; }) => {
  const [name, setName] = useState(user.name);
  const [imagePreview, setImagePreview] = useState<string | null>(user.avatar);
  const [imageData, setImageData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageData(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    if (imageData) {
      formData.append('image', imageData);
    }

    const result = await updateUserProfile(formData);

    if (result.success) {
      toast({
        title: 'Success',
        description: result.message,
      });
      setOpen(false);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message,
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={imagePreview || undefined} alt={name} />
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
              </Avatar>
              <Button
                type="button"
                size="icon"
                className="absolute bottom-0 right-0 rounded-full h-7 w-7"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const MoodChanger = () => {
  const { setMood } = useMood();
  const moods: { mood: Mood; emoji: string }[] = [
    { mood: 'happy', emoji: '😄' },
    { mood: 'love', emoji: '❤️' },
    { mood: 'surprised', emoji: '😮' },
    { mood: 'angry', emoji: '😡' },
    { mood: 'sad', emoji: '😢' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Smile className="mr-2 h-4 w-4" /> Set Mood
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="flex gap-2">
          {moods.map(({ mood, emoji }) => (
            <TooltipProvider key={mood}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-2xl rounded-full"
                    onClick={() => setMood(mood)}
                  >
                    {emoji}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{mood.charAt(0).toUpperCase() + mood.slice(1)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};


const UserMenu = ({ user }: { user: User }) => {
    const router = useRouter();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const handleLogout = async () => {
        await auth.signOut();
        router.push('/login');
    };

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" className="w-full h-auto justify-start items-center p-3 text-left rounded-lg">
                        <Avatar className="h-10 w-10 mr-4 relative">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-semibold truncate">{user.name}</p>
                            <p className="text-sm text-muted-foreground">My Account</p>
                        </div>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-60 p-2">
                    <div className="flex flex-col gap-1">
                        <Button variant="ghost" className="w-full justify-start" onClick={() => setIsSettingsOpen(true)}>
                           <UserIcon className="mr-2 h-4 w-4" /> Edit Profile
                        </Button>
                        <MoodChanger />
                        <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
            <ProfileSettingsDialog user={user} open={isSettingsOpen} setOpen={setIsSettingsOpen} />
        </>
    );
};

const ConversationItem = ({
  user,
  lastMessage,
  unreadCount,
  selectedUser,
  onSelectUser,
  onClearHistory,
}: {
  user: User;
  lastMessage: string;
  unreadCount: number;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onClearHistory: (userId: string) => void;
}) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleDeleteChat = () => {
    onClearHistory(user.id);
    setIsAlertOpen(false);
  };

  return (
    <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
      <ContextMenu>
        <ContextMenuTrigger>
          <Button
            variant="ghost"
            className={cn(
              'w-full h-auto justify-start items-center p-3 text-left rounded-lg transition-colors',
              selectedUser?.id === user.id && 'bg-secondary'
            )}
            onClick={() => onSelectUser(user)}
          >
            <Avatar className="h-12 w-12 mr-4 relative">
              <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="profile picture" />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              {user.isOnline && (
                <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-accent ring-2 ring-background"></div>
              )}
            </Avatar>
            <div className="flex-1 overflow-hidden">
              <p className="font-semibold truncate">{user.name}</p>
              <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground ml-2">{unreadCount}</Badge>
            )}
          </Button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={() => onSelectUser(user)}>Open Chat</ContextMenuItem>
          <ContextMenuItem className="text-destructive" onClick={() => setIsAlertOpen(true)}>
             <Trash2 className="mr-2 h-4 w-4" /> Delete Chat
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
       <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will delete the chat history for you only. The other person will still see the messages. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDeleteChat}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};


export function Sidebar({ users, allUsers, messages, loggedInUser, selectedUser, onSelectUser, onClearHistory }: SidebarProps) {
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const otherUsers = allUsers.filter(u => u.id !== loggedInUser.id);
  const { canInstall, install } = usePWAInstall();

  const conversations = users.map(user => {
    const userMessages = messages
      .filter(m => !m.deletedFor?.includes(loggedInUser.id) && ((m.senderId === user.id && m.receiverId === loggedInUser.id) || (m.senderId === loggedInUser.id && m.receiverId === user.id)))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const lastMessage = userMessages[0];
    const unreadCount = messages.filter(m => m.senderId === user.id && m.receiverId === loggedInUser.id && !m.read && !m.deletedFor?.includes(loggedInUser.id)).length;

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
        <Image src="/zm.png" alt="Z Messenger Logo" width={100} height={25} className="rounded-lg" />
        <div className="flex items-center gap-1">
          {canInstall && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={install}>
                    <Download />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Install App</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <NewChatDialog users={otherUsers} onSelectUser={onSelectUser} open={isNewChatOpen} setOpen={setIsNewChatOpen}/>
        </div>
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
            <ConversationItem
              key={user.id}
              user={user}
              lastMessage={lastMessage}
              unreadCount={unreadCount}
              selectedUser={selectedUser}
              onSelectUser={onSelectUser}
              onClearHistory={onClearHistory}
            />
          ))}
        </div>
      </ScrollArea>
       <div className="p-2 border-t">
        <UserMenu user={loggedInUser} />
      </div>
    </div>
  );
}
