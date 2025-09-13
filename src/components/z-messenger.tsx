
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Message, User } from '@/lib/data';
import { Sidebar } from '@/components/sidebar';
import { ChatHeader, ChatMessages, ChatInput } from '@/components/chat';
import { Card } from '@/components/ui/card';
import { db, storage } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  orderBy,
  doc,
  writeBatch,
  Timestamp,
  serverTimestamp,
  updateDoc,
  setDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
  getDocs,
  deleteDoc,
} from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useAuth } from './auth-provider';
import { CallView, type Call } from './call-view';
import { hangUp, answerCall, startCall } from '@/lib/webrtc';
import { updateMessage, deleteMessage } from '@/app/actions';
import type { Mood } from './mood-provider';
import { useToast } from '@/hooks/use-toast';

const getConversationId = (userId1: string, userId2: string) => {
  return [userId1, userId2].sort().join('_');
};

export function ZMessenger() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [isTyping, setIsTyping] = useState(false);
  const { user: authUser } = useAuth();
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<Call | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [conversationMood, setConversationMood] = useState<Mood>('happy');
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);


  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  const [localStreamState, setLocalStreamState] = useState<MediaStream | null>(null);
  const [remoteStreamState, setRemoteStreamState] = useState<MediaStream | null>(null);
  const { toast } = useToast();

  // Derive loggedInUser from authUser and allUsers list
   useEffect(() => {
    if (authUser) {
      // Prefer the real-time user object from Firestore if available
      const userFromList = allUsers.find(u => u.id === authUser.uid);
      if (userFromList) {
        setLoggedInUser(userFromList);
      } else {
        // Fallback to authUser details if not yet in the list
        setLoggedInUser({
          id: authUser.uid,
          name: authUser.displayName || 'You',
          avatar: authUser.photoURL || `https://picsum.photos/seed/${authUser.uid}/200/200`,
          isOnline: true,
        });
      }
    } else {
      setLoggedInUser(null);
    }
  }, [authUser, allUsers]);


  // User presence management
  useEffect(() => {
    if (!loggedInUser?.id) return;
    const userRef = doc(db, 'users', loggedInUser.id);
    
    const updateUserPresence = (isOnline: boolean) => {
        setDoc(userRef, { isOnline, lastSeen: serverTimestamp() }, { merge: true });
    };

    updateUserPresence(true);

    const handleBeforeUnload = () => {
        updateUserPresence(false);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
        updateUserPresence(false);
        window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [loggedInUser?.id]);


  // Fetch all users
  useEffect(() => {
    const usersQuery = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(usersQuery, (querySnapshot) => {
      const usersData: User[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        usersData.push({
          id: doc.id,
          name: data.displayName || 'No Name',
          avatar: data.photoURL || `https://picsum.photos/seed/${doc.id}/200/200`,
          isOnline: data.isOnline,
        });
      });
      setAllUsers(usersData);
    });
     return () => unsubscribeUsers();
  }, []);

  // Update selectedUser when allUsers list changes
  useEffect(() => {
      if (selectedUser) {
        const updatedSelectedUser = allUsers.find(u => u.id === selectedUser.id);
        if (updatedSelectedUser) {
            setSelectedUser(updatedSelectedUser);
        }
      }
  }, [allUsers, selectedUser]);

  // Fetch all messages for the logged-in user
  useEffect(() => {
    if (!loggedInUser?.id) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('participants', 'array-contains', loggedInUser.id),
      orderBy('timestamp', 'asc')
    );
    
    const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
      const allMessages = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: (data.timestamp as Timestamp)?.toDate() ?? new Date(),
          reactions: data.reactions || [],
          deletedFor: data.deletedFor || [],
        } as Message;
      });
      setMessages(allMessages);
    });

    return () => unsubscribeMessages();
  }, [loggedInUser?.id]);


  const conversations = useMemo(() => {
    if (!loggedInUser?.id) return [];
    const userIdsInConversations = new Set<string>();
    messages.forEach(message => {
        if (!message.deletedFor?.includes(loggedInUser.id)) {
            const otherUserId = message.senderId === loggedInUser.id ? message.receiverId : message.senderId;
            userIdsInConversations.add(otherUserId);
        }
    });

    const allOtherUsers = allUsers.filter(user => user.id !== loggedInUser.id);
    const conversationUsers = allOtherUsers.filter(user => userIdsInConversations.has(user.id));
    
    return conversationUsers;

  }, [messages, allUsers, loggedInUser?.id]);

  // Set initial user on desktop
  useEffect(() => {
    if (!isMobile && !selectedUser && conversations.length > 0) {
        setSelectedUser(conversations[0]);
    }
  }, [conversations, isMobile, selectedUser]);


  // Mark messages as read
  useEffect(() => {
    if (!selectedUser || !loggedInUser?.id) return;

    const unreadMessages = messages.filter(m => 
        m.receiverId === loggedInUser.id && 
        m.senderId === selectedUser.id && 
        !m.read
    );

    if (unreadMessages.length > 0) {
        const batch = writeBatch(db);
        unreadMessages.forEach(message => {
            const messageRef = doc(db, 'messages', message.id);
            batch.update(messageRef, { read: true });
        });
        batch.commit().catch(console.error);
    }
  }, [selectedUser, messages, loggedInUser?.id]);


  // Typing status and mood management for the current conversation
  useEffect(() => {
    if (!selectedUser || !loggedInUser?.id) return;
    const conversationId = getConversationId(loggedInUser.id, selectedUser.id);
    const conversationRef = doc(db, 'conversations', conversationId);

    const unsubscribe = onSnapshot(conversationRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        // Typing indicator
        if (data.typing) {
          setIsTyping(data.typing[selectedUser.id] || false);
        } else {
          setIsTyping(false);
        }
        // Conversation mood
        if (data.mood) {
          setConversationMood(data.mood);
        } else {
          setConversationMood('happy');
        }
      } else {
        // If conversation doc doesn't exist, create it with default mood
        setDoc(conversationRef, { mood: 'happy' });
      }
    });

    return () => unsubscribe();
  }, [selectedUser, loggedInUser?.id]);


  // Listen for incoming calls
  useEffect(() => {
    if (!loggedInUser?.id) return;

    const callsQuery = query(
      collection(db, 'calls'),
      where('calleeId', '==', loggedInUser.id)
    );

    const unsubscribe = onSnapshot(callsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const callData = change.doc.data();
          if (callData.offer) {
            const caller = allUsers.find(u => u.id === callData.callerId);
            if (caller && loggedInUser) {
              setIncomingCall({
                caller: caller,
                callee: loggedInUser,
                type: callData.type,
                status: 'ringing'
              });
              setCallId(change.doc.id);
            }
          }
        } else if (change.type === 'removed') {
           if (change.doc.id === callId) {
             setIncomingCall(null);
             handleEndCall();
           }
        }
      });
    });

    return () => unsubscribe();
  }, [loggedInUser?.id, allUsers, callId, loggedInUser]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !selectedUser || !loggedInUser) return;

    const conversationId = getConversationId(loggedInUser.id, selectedUser.id);
    await addDoc(collection(db, 'messages'), {
      conversationId,
      senderId: loggedInUser.id,
      receiverId: selectedUser.id,
      participants: [loggedInUser.id, selectedUser.id],
      content,
      timestamp: serverTimestamp(),
      read: false,
      reactions: [],
      deletedFor: [],
    });
  };

  const handleSendFile = async (file: File) => {
    if (!selectedUser || !loggedInUser) return;

    toast({
        title: 'Uploading file...',
        description: 'Please wait while your file is being uploaded.',
    });

    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const fileDataUri = reader.result as string;
            const conversationId = getConversationId(loggedInUser.id, selectedUser.id);
            
            const match = fileDataUri.match(/^data:(.+);base64,(.+)$/);
            if (!match) {
                throw new Error('Invalid file data URI');
            }
            const contentType = match[1];
            
            const fileRef = ref(storage, `chat_media/${conversationId}/${Date.now()}_${file.name}`);
            await uploadString(fileRef, fileDataUri, 'data_url', { contentType });
            const downloadURL = await getDownloadURL(fileRef);

            await addDoc(collection(db, 'messages'), {
                conversationId,
                senderId: loggedInUser.id,
                receiverId: selectedUser.id,
                participants: [loggedInUser.id, selectedUser.id],
                content: '',
                fileURL: downloadURL,
                fileName: file.name,
                fileType: file.type,
                timestamp: serverTimestamp(),
                read: false,
                reactions: [],
                deletedFor: [],
            });
             toast({
                title: 'Success!',
                description: 'File uploaded successfully.',
            });
        };
    } catch (error) {
        console.error("Error sending file:", error);
        toast({
            variant: 'destructive',
            title: 'Upload failed',
            description: 'There was a problem uploading your file. Please check permissions.',
        });
    }
  };

  const handleUpdateReaction = async (messageId: string, emoji: string) => {
    if (!loggedInUser) return;
    const messageRef = doc(db, 'messages', messageId);
    const messageDoc = await getDoc(messageRef);
    if (!messageDoc.exists()) return;
  
    const messageData = messageDoc.data();
    const existingReactions = (messageData.reactions || []) as {emoji: string; userId: string}[];
    const myReaction = existingReactions.find(r => r.userId === loggedInUser.id);
  
    if (myReaction) {
      await updateDoc(messageRef, {
        reactions: arrayRemove(myReaction),
      });
      if (myReaction.emoji !== emoji) {
        await updateDoc(messageRef, {
            reactions: arrayUnion({ emoji, userId: loggedInUser.id }),
        });
      }
    } else {
      await updateDoc(messageRef, {
        reactions: arrayUnion({ emoji, userId: loggedInUser.id }),
      });
    }
  };

  const handleClearHistory = async (otherUserId: string) => {
    if (!loggedInUser) return;
    const conversationId = getConversationId(loggedInUser.id, otherUserId);
    const messagesQuery = query(
      collection(db, 'messages'),
      where('conversationId', '==', conversationId)
    );

    const querySnapshot = await getDocs(messagesQuery);
    const batch = writeBatch(db);
    querySnapshot.forEach(doc => {
      batch.update(doc.ref, {
        deletedFor: arrayUnion(loggedInUser.id)
      });
    });
    await batch.commit();

    if (selectedUser?.id === otherUserId) {
        setSelectedUser(null);
    }
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!selectedUser || !loggedInUser) return;
    const conversationId = getConversationId(loggedInUser.id, selectedUser.id);
    const conversationRef = doc(db, 'conversations', conversationId);
    try {
        await setDoc(conversationRef, {
            typing: {
                [loggedInUser.id]: isTyping
            }
        }, { merge: true });
    } catch (error) {
       console.error("Error updating typing status:", error)
    }
  }

  const handleSetMood = async (mood: Mood) => {
    if (!selectedUser || !loggedInUser) return;
    const conversationId = getConversationId(loggedInUser.id, selectedUser.id);
    const conversationRef = doc(db, 'conversations', conversationId);
    try {
      await setDoc(conversationRef, { mood }, { merge: true });
    } catch (error) {
      console.error("Failed to update conversation mood:", error);
    }
  };
  
  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSelectedMessages([]); // Clear selection when switching chats
  }
  
  const currentChatMessages = useMemo(() => {
    if (!selectedUser || !loggedInUser) return [];
    return messages.filter(m => m.conversationId === getConversationId(loggedInUser.id, selectedUser.id));
  }, [selectedUser, messages, loggedInUser]);
  
  const handleStartCall = async (userToCall: User, type: 'audio' | 'video') => {
    if (!loggedInUser) return;
    const newCallId = await startCall(loggedInUser, userToCall, type, (pc, local, remote) => {
      peerConnectionRef.current = pc;
      localStreamRef.current = local;
      remoteStreamRef.current = remote;
      setLocalStreamState(local);
      setRemoteStreamState(remote);
      
      const callData: Call = { 
        caller: loggedInUser, 
        callee: userToCall,
        type,
        status: 'ringing'
      };
      setActiveCall(callData);
      
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'connected') {
          setActiveCall({...callData, status: 'active'});
        }
      };
    });
    if (newCallId) {
      setCallId(newCallId);
    }
  };

  const handleAcceptCall = async () => {
    if (incomingCall && callId) {
      await answerCall(callId, (pc, local, remote) => {
        peerConnectionRef.current = pc;
        localStreamRef.current = local;
        remoteStreamRef.current = remote;
        setLocalStreamState(local);
        setRemoteStreamState(remote);
        setActiveCall({ ...incomingCall, status: 'active' });
        setIncomingCall(null);
      });
    }
  };

  const handleDeclineCall = async () => {
    if (callId) {
      const callDocRef = doc(db, 'calls', callId);
      const docSnap = await getDoc(callDocRef);
      if (docSnap.exists()) {
        await deleteDoc(callDocRef);
      }
    }
    setIncomingCall(null);
    setCallId(null);
  };
  
  const handleEndCall = async () => {
    if (callId) {
      await hangUp(callId, peerConnectionRef, localStreamRef, remoteStreamRef);
    }
    setActiveCall(null);
    setIncomingCall(null);
    setCallId(null);
    setLocalStreamState(null);
    setRemoteStreamState(null);
  };
  
  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
  }

  const handleCancelEdit = () => {
      setEditingMessage(null);
  }

  const handleUpdateMessage = async (messageId: string, newContent: string) => {
    try {
      await updateMessage(messageId, newContent);
      setEditingMessage(null);
    } catch (error) {
      console.error("Error updating message:", error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
     try {
      await deleteMessage(messageId);
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };
  
  const handleSelectMessage = (messageId: string) => {
    setSelectedMessages(prev => 
      prev.includes(messageId) 
        ? prev.filter(id => id !== messageId)
        : [...prev, messageId]
    );
  };

  const handleClearSelection = () => {
    setSelectedMessages([]);
  };

  const handleDeleteSelectedMessages = async () => {
    const promises = selectedMessages.map(id => deleteMessage(id));
    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Error deleting selected messages:", error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete all selected messages.',
      });
    } finally {
      setSelectedMessages([]);
    }
  };
  
  if (!loggedInUser) {
    return null; // Or a loading spinner, handled by page.tsx
  }

  const viewToShow = isMobile && !selectedUser ? 'sidebar' : 'chat';
  
  return (
    <div className="h-full relative overflow-hidden">
      <Card className="h-full flex shadow-lg overflow-hidden">
        { (viewToShow === 'sidebar' || !isMobile) &&
          <Sidebar
            conversations={conversations}
            loggedInUser={loggedInUser}
            selectedUser={selectedUser}
            onSelectUser={handleSelectUser}
            onClearHistory={handleClearHistory}
            messages={messages}
            allUsers={allUsers}
          />
        }
        { (viewToShow === 'chat' || !isMobile) &&
          <div className="flex-1 flex flex-col bg-background w-full">
            {selectedUser ? (
              <>
                <ChatHeader 
                  user={selectedUser} 
                  onBack={() => setSelectedUser(null)} 
                  isMobile={isMobile} 
                  onClearHistory={() => handleClearHistory(selectedUser.id)} 
                  onStartCall={handleStartCall}
                  onSetMood={handleSetMood}
                  mood={conversationMood}
                  selectedMessagesCount={selectedMessages.length}
                  onDeleteSelected={handleDeleteSelectedMessages}
                  onClearSelection={handleClearSelection}
                />
                <div className="flex-1 flex flex-col overflow-y-auto">
                    <ChatMessages 
                        messages={currentChatMessages} 
                        loggedInUser={loggedInUser} 
                        allUsers={[loggedInUser, ...allUsers]} 
                        isTyping={isTyping} 
                        selectedMessages={selectedMessages}
                        onUpdateReaction={handleUpdateReaction}
                        onEdit={handleEditMessage}
                        onDelete={handleDeleteMessage}
                        onSelectMessage={handleSelectMessage}
                    />
                </div>
                <ChatInput 
                    onSendMessage={handleSendMessage} 
                    onUpdateMessage={handleUpdateMessage}
                    onTyping={handleTyping} 
                    editingMessage={editingMessage}
                    onCancelEdit={handleCancelEdit}
                    onSendFile={handleSendFile}
                />
              </>
            ) : (
              <div className="hidden md:flex h-full items-center justify-center bg-card">
                <p className="text-muted-foreground">Select a conversation or start a new one</p>
              </div>
            )}
          </div>
        }
      </Card>
      <CallView
        activeCall={activeCall}
        incomingCall={incomingCall}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
        onEnd={handleEndCall}
        localStream={localStreamState}
        remoteStream={remoteStreamState}
      />
    </div>
  );
}
