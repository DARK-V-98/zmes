
import React, { useState, useRef } from 'react';
import type { Message, User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Search, Download, Settings, Camera, LogOut, User as UserIcon, Smile, Trash2, Share, MessageSquarePlus, Moon, Sun, Palette } from 'lucide-react';
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
import { updateUserProfile, searchUsers } from '@/app/actions';
import { Mood } from './mood-provider';
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
} from "@/components/ui/alert-dialog";
import { useTheme, type Theme } from './theme-provider';
import { Logo } from './logo';

interface SidebarProps {
  conversations: User[];
  loggedInUser: User;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onClearHistory: (userId: string) => void;
  messages: Message[];
  allUsers: User[];
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

const ThemeChanger = () => {
  const { setTheme } = useTheme();
  const themes: { name: string; theme: Theme, color: string }[] = [
    { name: 'Light', theme: 'light', color: 'bg-slate-200' },
    { name: 'Dark', theme: 'dark', color: 'bg-slate-800' },
    { name: 'Blue', theme: 'theme-blue', color: 'bg-blue-500' },
    { name: 'Green', theme: 'theme-green', color: 'bg-green-500' },
    { name: 'Pink', theme: 'theme-pink', color: 'bg-pink-500' },
    { name: 'Orange', theme: 'theme-orange', color: 'bg-orange-500' },
  ];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="w-full justify-start">
          <Palette className="mr-2 h-4 w-4" /> Change Theme
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2">
        <div className="grid grid-cols-3 gap-2">
          {themes.map(({ name, theme, color }) => (
            <TooltipProvider key={name}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10"
                    onClick={() => setTheme(theme)}
                  >
                    <div className={cn("h-6 w-6 rounded-full", color)} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{name}</p>
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
                        <ThemeChanger />
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

const NewChatDialog = ({ loggedInUser, onSelectUser }: { loggedInUser: User, onSelectUser: (user: User) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setSearched(true);
    const results = await searchUsers(search, loggedInUser.id);
    setSearchResults(results);
    setLoading(false);
  };

  const handleSelect = (user: User) => {
    onSelectUser(user);
    setIsOpen(false);
  }
  
  const resetState = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearch('');
      setSearchResults([]);
      setSearched(false);
      setLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={resetState}>
      <DialogTrigger asChild>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <MessageSquarePlus />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start a new chat</DialogTitle>
          <DialogDescription>
            Search for a user by their full name or email to start a conversation.
          </DialogDescription>
        </DialogHeader>
        <div className="py-2 flex gap-2">
          <Input 
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? '...' : <Search />}
          </Button>
        </div>
        <ScrollArea className="max-h-60">
          <div className="pr-4">
            {loading ? (
                <p className="text-center text-sm text-muted-foreground py-4">Searching...</p>
            ) : searched && searchResults.length > 0 ? (
              searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <p className="font-semibold">{user.name}</p>
                  </div>
                  <Button size="sm" onClick={() => handleSelect(user)}>Chat</Button>
                </div>
              ))
            ) : searched ? (
              <p className="text-center text-sm text-muted-foreground py-4">No users found.</p>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
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
  lastMessage?: string;
  unreadCount?: number;
  selectedUser: User | null;
  onSelectUser: (user: User) => void;
  onClearHistory?: (userId: string) => void;
}) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleDeleteChat = () => {
    if (onClearHistory) {
      onClearHistory(user.id);
    }
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
              {lastMessage && (
                <p className="text-sm text-muted-foreground truncate">{lastMessage}</p>
              )}
            </div>
            {unreadCount !== undefined && unreadCount > 0 && (
              <Badge className="bg-primary text-primary-foreground ml-2">{unreadCount}</Badge>
            )}
          </Button>
        </ContextMenuTrigger>
        {onClearHistory && (
          <ContextMenuContent>
            <ContextMenuItem onClick={() => onSelectUser(user)}>Open Chat</ContextMenuItem>
            <AlertDialogTrigger asChild>
                <ContextMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Chat
                </ContextMenuItem>
            </AlertDialogTrigger>
          </ContextMenuContent>
        )}
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


export function Sidebar({ conversations, loggedInUser, selectedUser, onSelectUser, onClearHistory, messages, allUsers }: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
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
  
  const handleSelectNewUser = (user: User) => {
    onSelectUser(user);
  };
  
  const filteredConversations = searchTerm ? conversationDetails.filter(({ user }) => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) : conversationDetails;

  return (
    <div className="w-full md:w-1/3 md:max-w-sm lg:w-1/4 lg:max-w-md border-r flex flex-col">
      <div className="p-2 sm:p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
            <Logo />
            <span className="font-semibold text-lg">Z Messenger</span>
        </div>
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
           <NewChatDialog loggedInUser={loggedInUser} onSelectUser={handleSelectNewUser} />
        </div>
      </div>
       <div className="p-2 sm:p-4 border-b">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search conversations..." 
            className="pl-10" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
