
'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import type { Message, User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, CheckCheck, MoreVertical, Paperclip, Send, SmilePlus, ArrowLeft, Download, Trash2, Phone, Share } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generateSmartReplies } from '@/app/actions';
import { Skeleton } from './ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { usePWAInstall } from './pwa-install-provider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';


interface ChatProps {
  user: User;
  loggedInUser: User;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onUpdateReaction: (messageId: string, emoji: string) => void;
  onClearHistory: (userId: string) => void;
  onBack?: () => void;
  isMobile: boolean;
  isTyping: boolean;
  onTyping: (isTyping: boolean) => void;
  onStartCall: (user: User) => void;
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

const ChatHeader = ({ user, onBack, isMobile, onClearHistory, onStartCall }: { user: User, onBack?: () => void, isMobile: boolean, onClearHistory: () => void, onStartCall: (user: User) => void }) => {
  const { canInstall, install } = usePWAInstall();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isInstallSheetOpen, setIsInstallSheetOpen] = useState(false);
  
  const showInstallButton = isMobile || canInstall;
  
  const handleInstallClick = () => {
    if (canInstall) {
        install();
    } else if (isMobile) {
        setIsInstallSheetOpen(true);
    }
  };

  const handleClearHistory = () => {
    onClearHistory();
    setIsAlertOpen(false);
  }

  return (
    <div className="flex items-center p-4 border-b">
      {isMobile && (
          <Button variant="ghost" size="icon" className="mr-2" onClick={onBack}>
            <ArrowLeft />
          </Button>
        )}
      <Avatar className="h-10 w-10 mr-4">
        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="profile picture" />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-semibold">{user.name}</p>
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2.5 w-2.5 rounded-full", user.isOnline ? "bg-accent" : "bg-gray-400")}></span>
          <span className="text-xs text-muted-foreground">{user.isOnline ? 'Online' : 'Offline'}</span>
        </div>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => onStartCall(user)}>
              <Phone />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Start audio call</TooltipContent>
        </Tooltip>
      </TooltipProvider>
       {showInstallButton && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleInstallClick}>
                <Download />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Install App</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
             <AlertDialogTrigger asChild>
              <DropdownMenuItem className="cursor-pointer">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Clear History</span>
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the chat history for you only. The other person will still see the messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearHistory}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <IOSInstallInstructions open={isInstallSheetOpen} onOpenChange={setIsInstallSheetOpen} />
    </div>
  );
};

const ReadStatus = ({ read }: { read: boolean }) => {
    const Icon = read ? CheckCheck : Check;
    return <Icon className={cn("h-4 w-4", read ? "text-accent" : "text-muted-foreground")} />;
};

const EmojiPicker = ({ onSelectEmoji }: { onSelectEmoji: (emoji: string) => void }) => {
  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
          <SmilePlus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-1 rounded-full">
        <div className="flex gap-1">
          {emojis.map((emoji) => (
            <Button 
              key={emoji} 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-lg"
              onClick={() => onSelectEmoji(emoji)}
            >
              {emoji}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ChatMessage = ({ message, isSender, sender, onUpdateReaction }: { message: Message; isSender: boolean; sender: User; onUpdateReaction: (messageId: string, emoji: string) => void; }) => {
    const [showPicker, setShowPicker] = useState(false);

    return (
      <div
        className={cn('group flex items-start gap-3 my-4', isSender && 'flex-row-reverse')}
        onMouseEnter={() => setShowPicker(true)}
        onMouseLeave={() => setShowPicker(false)}
      >
        <Avatar className="h-8 w-8">
          <AvatarImage src={sender.avatar} alt={sender.name} data-ai-hint="profile picture" />
          <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className={cn('relative flex flex-col max-w-xs md:max-w-md lg:max-w-lg', isSender && 'items-end')}>
            <div className={cn(
                'px-4 py-2 rounded-2xl flex items-end gap-2',
                isSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none'
            )}>
                <p className="break-words">{message.content}</p>
                {message.reactions && message.reactions.length > 0 && (
                    <div className="absolute -bottom-3 right-2 bg-card border rounded-full px-1.5 py-0.5 text-xs">
                        {message.reactions[0].emoji} {message.reactions.length}
                    </div>
                )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 px-1">
              <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              {isSender && <ReadStatus read={message.read} />}
            </div>
        </div>
        <div className={cn("self-center transition-opacity duration-200", showPicker ? "opacity-100" : "opacity-0", isSender && "order-first")}>
            <EmojiPicker onSelectEmoji={(emoji) => onUpdateReaction(message.id, emoji)} />
        </div>
      </div>
    );
};

const TypingIndicator = () => (
  <div className="flex items-center gap-2 p-4 pt-0">
    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
    <span className="text-xs text-muted-foreground">typing...</span>
  </div>
);


const ChatMessages = ({ messages, loggedInUser, allUsers, isTyping, onUpdateReaction }: { messages: Message[]; loggedInUser: User; allUsers: User[], isTyping: boolean, onUpdateReaction: (messageId: string, emoji: string) => void; }) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const atBottomRef = useRef(true);
  const usersMap = new Map(allUsers.map(user => [user.id, user]));

  const handleScroll = () => {
    const viewport = viewportRef.current;
    if (viewport) {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      atBottomRef.current = isAtBottom;
    }
  };

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport && atBottomRef.current) {
        viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isTyping]);
  
  const visibleMessages = messages.filter(m => !m.deletedFor?.includes(loggedInUser.id));

  return (
    <ScrollArea className="flex-1 p-4" viewportRef={viewportRef} onScroll={handleScroll}>
      <div className="space-y-4">
        {visibleMessages.length > 0 ? visibleMessages.map((message) => {
          const isSender = message.senderId === loggedInUser.id;
          const sender = isSender ? loggedInUser : usersMap.get(message.senderId)
          if (!sender) return null;
          return <ChatMessage key={message.id} message={message} isSender={isSender} sender={sender} onUpdateReaction={onUpdateReaction}/>;
        }) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <p>No messages yet.</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        )}
        {isTyping && <TypingIndicator />}
      </div>
    </ScrollArea>
  );
};

const SmartReplies = ({ lastMessage, onSelectReply }: { lastMessage: Message | null, onSelectReply: (reply: string) => void }) => {
  const [replies, setReplies] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (lastMessage) {
      startTransition(async () => {
        try {
          const result = await generateSmartReplies(lastMessage.content);
          setReplies(result);
        } catch (error) {
          console.error("Failed to generate smart replies:", error);
          setReplies([]);
        }
      });
    } else {
      setReplies([]);
    }
  }, [lastMessage]);

  if (!lastMessage || (isPending && replies.length === 0)) {
    return (
        <div className="flex gap-2 p-4 pt-0 h-[52px] items-center">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
        </div>
    );
  }

  if (replies.length === 0) return <div className="h-[52px]"></div>

  return (
    <div className="flex gap-2 p-4 pt-0 h-[52px] items-center overflow-x-auto">
      {replies.map((reply, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="rounded-full shrink-0"
          onClick={() => onSelectReply(reply)}
        >
          {reply}
        </Button>
      ))}
    </div>
  );
};

const ChatInput = ({ onSendMessage, onTyping }: { onSendMessage: (content: string) => void, onTyping: (isTyping: boolean) => void }) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTyping = (text: string) => {
    setMessage(text);
    if (!typingTimeoutRef.current) {
      onTyping(true);
    } else {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
      typingTimeoutRef.current = null;
    }, 1000);
  };
  
  const handleSend = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    onTyping(false);

    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  return (
    <div className="p-4 border-t">
      <div className="relative">
        <Input
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="pr-28 h-12 rounded-full"
        />
        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center gap-1">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <Paperclip />
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach media</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Button size="icon" className="rounded-full" onClick={handleSend} disabled={!message.trim()}>
                <Send />
            </Button>
        </div>
      </div>
    </div>
  );
};

export function Chat({ user, loggedInUser, messages, onSendMessage, onUpdateReaction, onClearHistory, onBack, isMobile, isTyping, onTyping, onStartCall }: ChatProps) {
  const allUsers = [loggedInUser, user];
  
  const visibleMessages = messages.filter(m => !m.deletedFor?.includes(loggedInUser.id));
  const lastMessageFromOtherUser = visibleMessages
    .slice()
    .reverse()
    .find(m => m.senderId === user.id);
  
  const handleSelectReply = (reply: string) => {
    onSendMessage(reply);
  };

  const handleClearHistory = () => {
    onClearHistory(user.id);
  }

  return (
    <div className="flex h-full flex-col bg-card w-full">
      <ChatHeader user={user} onBack={onBack} isMobile={isMobile} onClearHistory={handleClearHistory} onStartCall={onStartCall}/>
      <ChatMessages messages={messages} loggedInUser={loggedInUser} allUsers={allUsers} isTyping={isTyping} onUpdateReaction={onUpdateReaction} />
      <SmartReplies lastMessage={lastMessageFromOtherUser || null} onSelectReply={handleSelectReply}/>
      <ChatInput onSendMessage={onSendMessage} onTyping={onTyping} />
    </div>
  );
}
