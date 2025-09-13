
'use client';

import React from 'react';
import { useState, useRef, useEffect } from 'react';
import type { Message, User } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, CheckCheck, MoreVertical, Paperclip, Send, SmilePlus, ArrowLeft, Trash2, Phone, Edit, X, Smile, File, Download, Video, Loader2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { AlertDialogTrigger } from '@radix-ui/react-alert-dialog';
import { Mood, useMood } from './mood-provider';
import { THEME_MAP } from './theme-provider';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';

const MoodChanger = ({ onSetMood }: { onSetMood: (mood: Mood) => void }) => {
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
         <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Smile />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Set chat mood</TooltipContent>
            </Tooltip>
        </TooltipProvider>
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
                    onClick={() => onSetMood(mood)}
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


export const ChatHeader = ({ 
  user, 
  onBack, 
  isMobile, 
  onClearHistory, 
  onStartCall, 
  onSetMood, 
  mood,
  selectedMessagesCount,
  onDeleteSelected,
  onClearSelection,
}: { 
  user: User, 
  onBack?: () => void, 
  isMobile: boolean, 
  onClearHistory: () => void, 
  onStartCall: (user: User, type: 'audio' | 'video') => void, 
  onSetMood: (mood: Mood) => void, 
  mood: Mood,
  selectedMessagesCount: number,
  onDeleteSelected: () => void,
  onClearSelection: () => void,
}) => {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const handleClearHistory = () => {
    onClearHistory();
    setIsAlertOpen(false);
  }
  
  const handleDelete = () => {
    onDeleteSelected();
    setIsDeleteAlertOpen(false);
  };

  if (selectedMessagesCount > 0) {
    return (
      <div className="flex items-center p-2 sm:p-4 border-b bg-card z-10">
        <Button variant="ghost" size="icon" className="mr-2 h-8 w-8" onClick={onClearSelection}>
          <X />
        </Button>
        <div className="flex-1">
          <p className="font-semibold">{selectedMessagesCount} selected</p>
        </div>
        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete {selectedMessagesCount} message{selectedMessagesCount > 1 ? 's' : ''}?</AlertDialogTitle>
                    <AlertDialogDescription>
                    This will delete the message(s) for everyone. This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }


  return (
    <div className={cn("flex items-center p-2 sm:p-4 border-b bg-card z-10 transition-colors", THEME_MAP[mood])}>
      {isMobile && (
          <Button variant="ghost" size="icon" className="mr-2 h-8 w-8" onClick={onBack}>
            <ArrowLeft />
          </Button>
        )}
      <Link href={`/profile/${user.id}`} className="flex items-center flex-1 gap-2 sm:gap-4 group">
        <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
          <AvatarImage src={user.avatar} alt={user.name} data-ai-hint="profile picture" />
          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-sm sm:text-base group-hover:underline">{user.name}</p>
          <div className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", user.isOnline ? "bg-accent" : "bg-gray-400")}></span>
            <span className="text-xs text-muted-foreground">{user.isOnline ? 'Online' : 'Offline'}</span>
          </div>
        </div>
      </Link>
      <MoodChanger onSetMood={onSetMood} />
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onStartCall(user, 'audio')}>
              <Phone />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Start audio call</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onStartCall(user, 'video')}>
              <Video />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Start video call</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
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
  isSelected,
  onUpdateReaction,
  onEdit,
  onDelete,
  onSelectMessage,
}: { 
  message: Message; 
  isSender: boolean; 
  sender: User; 
  isSelected: boolean;
  onUpdateReaction: (messageId: string, emoji: string) => void;
  onEdit: (message: Message) => void;
  onDelete: (messageId: string) => void;
  onSelectMessage: (messageId: string) => void;
}) => {
    const [showActions, setShowActions] = useState(false);
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const longPressTimerRef = useRef<NodeJS.Timeout>();

    const handlePointerDown = () => {
        longPressTimerRef.current = setTimeout(() => {
            onSelectMessage(message.id);
        }, 500); // 500ms for long press
    };

    const handlePointerUp = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
        }
    };
    
    const handlePointerLeave = () => {
        if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
        }
    };
    
    const handleClick = () => {
        onSelectMessage(message.id)
    }

    const handleDelete = () => {
        onDelete(message.id);
        setIsAlertOpen(false);
    }
    
    const isImage = message.fileType?.startsWith('image/');
    const isVideo = message.fileType?.startsWith('video/');

    return (
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <div
          className={cn('group my-3 sm:my-4 flex gap-2 sm:gap-3 transition-colors duration-200 p-1 rounded-lg', 
            isSender ? 'justify-end' : 'justify-start',
            isSelected && 'bg-primary/10'
          )}
          onMouseEnter={() => setShowActions(true)}
          onMouseLeave={() => setShowActions(false)}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          onClick={isSelected ? handleClick : undefined}
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
                  'px-3 py-2 sm:px-4 rounded-2xl space-y-2',
                  isSender ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card border rounded-bl-none',
                  message.isDeleted && 'italic text-muted-foreground'
                )}>
                  {message.fileURL && (
                    isImage ? (
                        <Image src={message.fileURL} alt={message.fileName || 'Uploaded image'} width={200} height={200} className="rounded-lg max-w-xs" />
                    ) : isVideo ? (
                        <video src={message.fileURL} controls className="rounded-lg max-w-xs"></video>
                    ) : (
                       <a href={message.fileURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 rounded-lg bg-background/50 hover:bg-background">
                            <File className="h-6 w-6" />
                            <div className="flex flex-col">
                                <span className="font-semibold">{message.fileName}</span>
                                <span className="text-xs">Click to download</span>
                            </div>
                       </a>
                    )
                  )}
                  {message.content &&
                    <p className="break-words overflow-wrap-anywhere text-sm sm:text-base">{message.content}</p>
                  }
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
          
          <div className={cn("self-center transition-opacity duration-200 flex", (showActions && !isSelected) ? "opacity-100" : "opacity-0")}>
            <EmojiPicker onSelectEmoji={(emoji) => onUpdateReaction(message.id, emoji)} />
             {isSender && !message.isDeleted && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onEdit(message)} disabled={!!message.fileURL}>
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


export const ChatMessages = ({ messages, loggedInUser, allUsers, isTyping, selectedMessages, onUpdateReaction, onEdit, onDelete, onSelectMessage }: { 
    messages: Message[]; 
    loggedInUser: User; 
    allUsers: User[], 
    isTyping: boolean, 
    selectedMessages: string[],
    onUpdateReaction: (messageId: string, emoji: string) => void;
    onEdit: (message: Message) => void;
    onDelete: (messageId: string) => void;
    onSelectMessage: (messageId: string) => void;
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
      <div className="p-2 sm:p-4">
        {visibleMessages.length > 0 ? visibleMessages.map((message) => {
          const isSender = message.senderId === loggedInUser.id;
          const sender = isSender ? loggedInUser : usersMap.get(message.senderId)
          if (!sender) return null;
          return <ChatMessage 
                    key={message.id} 
                    message={message} 
                    isSender={isSender} 
                    sender={sender} 
                    isSelected={selectedMessages.includes(message.id)}
                    onUpdateReaction={onUpdateReaction}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onSelectMessage={onSelectMessage}
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


export const ChatInput = ({ 
    onSendMessage, 
    onUpdateMessage, 
    onTyping, 
    editingMessage, 
    onCancelEdit,
    smartReplies,
    isGeneratingReplies
}: { 
    onSendMessage: (content: string, file?: File) => void;
    onUpdateMessage: (messageId: string, newContent: string) => void;
    onTyping: (isTyping: boolean) => void;
    editingMessage: Message | null;
    onCancelEdit: () => void;
    smartReplies: string[];
    isGeneratingReplies: boolean;
}) => {
  const [message, setMessage] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
      if (editingMessage) {
          setMessage(editingMessage.content);
          inputRef.current?.focus();
          setAttachedFile(null);
          setFilePreview(null);
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

    if (message.trim() || attachedFile) {
      if (editingMessage) {
          onUpdateMessage(editingMessage.id, message);
      } else {
          onSendMessage(message, attachedFile || undefined);
      }
      setMessage('');
      setAttachedFile(null);
      setFilePreview(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        if (file.size > 20 * 1024 * 1024) { // 20MB limit
            toast({
                variant: 'destructive',
                title: 'File too large',
                description: 'Please select a file smaller than 20MB.',
            });
            return;
        }
        setAttachedFile(file);
        setFilePreview(URL.createObjectURL(file));
        onCancelEdit(); // Cancel any ongoing edit
    }
    // Reset file input
    if(event.target) {
        event.target.value = '';
    }
  };

  const handleRemoveAttachment = () => {
      setAttachedFile(null);
      setFilePreview(null);
  }
  
  const handleSmartReplyClick = (reply: string) => {
    onSendMessage(reply);
  };

  return (
    <div className="p-2 sm:p-4 border-t bg-card">
       {(smartReplies.length > 0 || isGeneratingReplies) && (
        <div className="flex items-center gap-2 mb-2 px-1">
          {isGeneratingReplies ? (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span>Generating replies...</span>
            </div>
          ) : (
            smartReplies.map((reply, index) => (
              <Button key={index} variant="outline" size="sm" className="rounded-full" onClick={() => handleSmartReplyClick(reply)}>
                {reply}
              </Button>
            ))
          )}
        </div>
      )}
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
      {filePreview && (
          <div className="relative w-24 h-24 mb-2 rounded-md overflow-hidden">
                {attachedFile?.type.startsWith('image/') ? (
                    <Image src={filePreview} alt="preview" layout="fill" objectFit="cover" />
                ) : (
                    <video src={filePreview} className="w-full h-full object-cover" />
                )}
                <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full" onClick={handleRemoveAttachment}>
                    <X className="h-4 w-4" />
                </Button>
          </div>
      )}
      <div className="relative flex items-center gap-2">
        <Input
          ref={inputRef}
          value={message}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type a message..."
          className="pr-16 sm:pr-20 h-10 sm:h-11 rounded-full"
          disabled={!!editingMessage && !!attachedFile}
        />
        <div className="absolute top-1/2 right-2 -translate-y-1/2 flex items-center gap-1">
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/*" />
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full h-7 w-7 sm:h-8 sm:w-8" onClick={() => fileInputRef.current?.click()} disabled={!!editingMessage}>
                        <Paperclip className="h-4 w-4 sm:h-5 sm:w-5"/>
                    </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach media</TooltipContent>
                </Tooltip>
            </TooltipProvider>
            <Button size="icon" className="rounded-full h-7 w-7 sm:h-8 sm:w-8" onClick={handleSend} disabled={!message.trim() && !attachedFile}>
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
        </div>
      </div>
    </div>
  );
};
