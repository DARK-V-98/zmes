export type User = {
  id: string;
  avatar: string;
  name: string;
  isOnline?: boolean;
};

export type Message = {
  id: string;
  conversationId?: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  reactions: { emoji: string; userId: string }[];
};
