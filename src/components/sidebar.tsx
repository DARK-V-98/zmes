
import React, { useState, useRef } from 'react';
import type { Message, User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { MessageSquarePlus, Search, Download, Settings, Camera, LogOut, User as UserIcon, Smile, Trash2, Share } from 'lucide-react';
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SidebarProps {
  conversations: User[];
  allUsers: User[];
  messages: Message[];
  loggedInUser: User;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onClearHistory: (userId: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}

const IOSInstallInstructions = ({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Install App on your Device</DialogTitle>
                <DialogDescription>
                    To install the app, tap the Share button in your browser and then "Add to Home Screen".
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 text-center">
                <p>1. Tap the <Share className="inline-block h-5 w-5 mx-1" /> icon in the menu bar.</p>
                <p className="mt-4">2. Scroll down and tap on "Add to Home Screen".</p>
            </div>
        </DialogContent>
    </Dialog>
);

const NewChatDialog = ({ users, onSelectUser }: { users: User[], onSelectUser: (user: User) => void; }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleSelect = (user: User) => {
    onSelectUser(user);
    setOpen(false);
    setSearchTerm('');
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                  <MessageSquarePlus />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent>New Chat</TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
                onClick={() => handleSelect(user)}
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
    if (!name.trim()) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Name cannot be empty.',
      });
      return;
    }
    if (!user.id) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to update your profile.',
      });
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('name', name);
    if (imageData) {
      formData.append('image', imageData);
    }

    const result = await updateUserProfile(user.id, formData);

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
             <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
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
                    <Button variant="ghost" className="w-full h-auto justify-start items-center p-2 sm:p-3 text-left rounded-lg">
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
            <Avatar className="h-10 w-10 sm:h-12 sm:w-12 mr-4 relative">
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
          <AlertDialogTrigger asChild>
            <ContextMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
              <Trash2 className="mr-2 h-4 w-4" /> Delete Chat
            </ContextMenuItem>
          </AlertDialogTrigger>
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


export function Sidebar({ conversations, allUsers, messages, loggedInUser, selectedUser, onSelectUser, onClearHistory, searchTerm, onSearchTermChange }: SidebarProps) {
  const otherUsers = allUsers.filter(u => u.id !== loggedInUser.id);
  const { canInstall, install } = usePWAInstall();
  const [isInstallSheetOpen, setIsInstallSheetOpen] = useState(false);
  
  const isIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  const isMobileDevice = () => /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const showInstallButton = canInstall || isMobileDevice();

  const handleInstallClick = () => {
    if (canInstall) {
        install();
    } else if (isIos() || isMobileDevice()) {
        setIsInstallSheetOpen(true);
    }
  };


  const conversationDetails = conversations.map(user => {
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

  const filteredConversations = conversationDetails.filter(({ user }) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full md:w-1/3 md:max-w-sm lg:w-1/4 lg:max-w-md border-r flex flex-col">
      <div className="p-2 sm:p-4 border-b flex justify-between items-center">
        <Image src="/zm.png" alt="Z Messenger Logo" width={100} height={25} className="rounded-lg" />
        <div className="flex items-center gap-1">
          {showInstallButton && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full" onClick={handleInstallClick}>
                    <Download />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Install App</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <NewChatDialog users={otherUsers} onSelectUser={onSelectUser} />
        </div>
      </div>
       <div className="p-2 sm:p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search" 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length > 0 ? filteredConversations.map(({ user, lastMessage, unreadCount }) => (
            <ConversationItem
              key={user.id}
              user={user}
              lastMessage={lastMessage}
              unreadCount={unreadCount}
              selectedUser={selectedUser}
              onSelectUser={onSelectUser}
              onClearHistory={onClearHistory}
            />
          )) : (
            <div className="text-center text-muted-foreground py-10">
              {searchTerm ? 'No conversations found.' : 'No active conversations.'}
            </div>
          )}
        </div>
      </ScrollArea>
       <div className="p-2 border-t">
        <UserMenu user={loggedInUser} />
      </div>
      <IOSInstallInstructions open={isInstallSheetOpen} onOpenChange={setIsInstallSheetOpen} />
    </div>
  );
}
