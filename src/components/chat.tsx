
'use client';

import React, { useState, useRef, useEffect, useTransition } from 'react';
import type { Message, User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, CheckCheck, MoreVertical, Paperclip, Send, SmilePlus, ArrowLeft, Trash2, Phone, Share, Edit, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { generateSmartReplies } from '@/app/actions';
import { Skeleton } from './ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
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
} from "@/components/ui/alert-dialog"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { AlertDialogTrigger } from '@radix-ui/react-alert-dialog';


interface ChatProps {
  user: User;
  loggedInUser: User;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onUpdateMessage: (messageId: string, newContent: string) => void;
  onDeleteMessage: (messageId: string) => void;
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
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleClearHistory = () => {
    onClearHistory();
    setIsAlertOpen(false);
  }

  return (
    <div className="flex items-center p-2 sm:p-4 border-b bg-card z-10">
      {isMobile && (
          <Button variant="ghost" size="icon" className="mr-2" onClick={onBack}>
            <ArrowLeft />
          </Button>
        )}
      <Avatar className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-4">
        <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="profile picture" />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <p className="font-semibold text-sm sm:text-base">{user.name}</p>
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
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
             <AlertDialogTrigger asChild>
              <DropdownMenuItem className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive">
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

const ChatMessage = ({ 
  message, 
  isSender, 
  sender, 
  onUpdateReaction,
  onEdit,
  onDelete,
}: { 
  message: Message; 
  isSender: boolean; 
  sender: User; 
  onUpdateReaction: (messageId: string, emoji: string) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
}) => {
    const [showActions, setShowActions] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const handleDelete = () => {
        onDelete(message.id);
        setIsAlertOpen(false);
    }

    return (
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <div
          className={cn('group w-full my-3 sm:my-4 flex gap-2 sm:gap-3', isSender && 'justify-end')}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
        >
          {!isSender && (
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 self-end">
              <AvatarImage src={sender.avatar} alt={sender.name} data-ai-hint="profile picture" />
              <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}

          <div className={cn('flex flex-col max-w-[85%] sm:max-w-[80%]', isSender ? 'items-end' : 'items-start')}>
              <div className="relative">
                <div className={cn(
                  'px-3 py-2 sm:px-4 rounded-2xl overflow-hidden',
                  isSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none',
                  message.isDeleted && 'italic text-muted-foreground'
                )}>
                  <p className="break-words text-sm sm:text-base">{message.content}</p>
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="absolute -bottom-3 right-2 bg-card border rounded-full px-1.5 py-0.5 text-xs">
                      {message.reactions[0].emoji} {message.reactions.length}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 px-1">
                <span>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {isSender && <ReadStatus read={message.read} />}
              </div>
          </div>
          
          {isSender && (
            <Avatar className="h-8 w-8 sm:h-10 sm:w-10 self-end">
              <AvatarImage src={sender.avatar} alt={sender.name} data-ai-hint="profile picture" />
              <AvatarFallback>{sender.name.charAt(0)}</AvatarFallback>
            </Avatar>
          )}

          <div className={cn("self-center transition-opacity duration-200 flex", showActions ? "opacity-100" : "opacity-0")}>
            <EmojiPicker onSelectEmoji={(emoji) => onUpdateReaction(message.id, emoji)} />
             {isSender && !message.isDeleted && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onEdit(message)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                        </DropdownMenuItem>
                         <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </DropdownMenuContent>
                </DropdownMenu>
             )}
          </div>
        </div>
         <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                This will delete the message for everyone. This action cannot be undone.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
};

const TypingIndicator = () => (
  <div className="flex items-center gap-2 px-4 py-2">
    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"></div>
    <span className="text-xs text-muted-foreground">typing...</span>
  </div>
);


const ChatMessages = ({ messages, loggedInUser, allUsers, isTyping, onUpdateReaction, onEdit, onDelete }: { 
    messages: Message[]; 
    loggedInUser: User; 
    allUsers: User[], 
    isTyping: boolean, 
    onUpdateReaction: (messageId: string, emoji: string) => void;
    onEdit: (message: Message) => void;
    onDelete: (messageId: string) => void;
}) => {
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
    <ScrollArea className="flex-1" viewportRef={viewportRef} onScroll={handleScroll}>
      <div className="p-4">
        {visibleMessages.length > 0 ? visibleMessages.map((message) => {
          const isSender = message.senderId === loggedInUser.id;
          const sender = isSender ? loggedInUser : usersMap.get(message.senderId)
          if (!sender) return null;
          return <ChatMessage 
                    key={message.id} 
                    message={message} 
                    isSender={isSender} 
                    sender={sender} 
                    onUpdateReaction={onUpdateReaction}
                    onEdit={onEdit}
                    onDelete={onDelete}
                 />;
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
    if (lastMessage && !lastMessage.isDeleted) {
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
        <div className="flex gap-2 p-2 sm:p-4 pt-0 h-[52px] items-center">
            <Skeleton className="h-9 w-24 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
        </div>
    );
  }

  if (replies.length === 0) return <div className="h-1 sm:h-[52px]"></div>

  return (
    <div className="p-2 sm:p-4 pt-0 h-[52px]">
      <div className="flex gap-2 items-center overflow-x-auto pb-2">
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
    </div>
  );
};

const ChatInput = ({ onSendMessage, onUpdateMessage, onTyping, editingMessage, onCancelEdit }: { 
    onSendMessage: (content: string) => void;
    onUpdateMessage: (messageId: string, newContent: string) => void;
    onTyping: (isTyping: boolean) => void;
    editingMessage: Message | null;
    onCancelEdit: () => void;
}) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (editingMessage) {
          setMessage(editingMessage.content);
          inputRef.current?.focus();
      } else {
          setMessage('');
      }
  }, [editingMessage]);

  const handleTyping = (text: string) => {
    setMessage(text);
    if (!editingMessage) {
        if (!typingTimeoutRef.current) {
            onTyping(true);
        } else {
            clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
            onTyping(false);
            typingTimeoutRef.current = null;
        }, 1000);
    }
  };
  
  const handleSend = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    onTyping(false);

    if (message.trim()) {
      if (editingMessage) {
          onUpdateMessage(editingMessage.id, message);
      } else {
          onSendMessage(message);
      }
      setMessage('');
    }
  };
  
  return (
    <div className="p-2 sm:p-4 border-t bg-card">
      {editingMessage && (
          <div className="flex items-center justify-between bg-secondary p-2 rounded-t-md">
              <div>
                <p className="font-bold text-sm">Editing Message</p>
                <p className="text-xs text-muted-foreground truncate">{editingMessage.content}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onCancelEdit}>
                  <X className="h-4 w-4" />
              </Button>
          </div>
      )}
      <div className="relative">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="pr-16 sm:pr-20 h-10 sm:h-11 rounded-full"
        />
        <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 sm:h-8 sm:w-8">
                        <Paperclip className="h-4 w-4 sm:h-5 sm:w-5"/>
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach media</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Button size="icon" className="rounded-full h-7 w-7 sm:h-8 sm:w-8" onClick={handleSend} disabled={!message.trim()}>
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
        </div>
      </div>
    </div>
  );
};

export function Chat({ user, loggedInUser, messages, onSendMessage, onUpdateMessage, onDeleteMessage, onUpdateReaction, onClearHistory, onBack, isMobile, isTyping, onTyping, onStartCall }: ChatProps) {
  const allUsers = [loggedInUser, user];
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  
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
  
  const handleEdit = (message: Message) => {
      setEditingMessage(message);
  }
  
  const handleCancelEdit = () => {
      setEditingMessage(null);
  }

  const handleUpdateMessage = (messageId: string, newContent: string) => {
      onUpdateMessage(messageId, newContent);
      setEditingMessage(null);
  }

  return (
    <div className="flex h-full flex-col bg-background w-full">
      <ChatHeader user={user} onBack={onBack} isMobile={isMobile} onClearHistory={handleClearHistory} onStartCall={onStartCall} />
      <div className="flex-1 overflow-y-auto">
        <ChatMessages 
            messages={messages} 
            loggedInUser={loggedInUser} 
            allUsers={allUsers} 
            isTyping={isTyping} 
            onUpdateReaction={onUpdateReaction}
            onEdit={handleEdit}
            onDelete={onDeleteMessage}
        />
      </div>
      <div>
        {!editingMessage && (
            <SmartReplies lastMessage={lastMessageFromOtherUser || null} onSelectReply={handleSelectReply}/>
        )}
        <ChatInput 
            onSendMessage={onSendMessage} 
            onUpdateMessage={handleUpdateMessage}
            onTyping={onTyping} 
            editingMessage={editingMessage}
            onCancelEdit={handleCancelEdit}
        />
      </div>
    </div>
  );
}
