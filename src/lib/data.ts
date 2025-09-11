export type User = {
  id: string;
  avatar: string;
  name: string;
};

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  reactions: { emoji: string; userId: string }[];
};
