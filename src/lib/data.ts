export type User = {
  id: string;
  avatar: string;
  name: string;
  isOnline?: boolean;
  email?: string;
  coverPhotoURL?: string;
  phoneNumber?: string;
  socialLinks?: { type: 'facebook' | 'instagram' | 'twitter' | 'website'; url: string }[];
  role?: 'user' | 'developer';
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
  reactions: { emoji: string; userId: string }[];
  deletedFor?: string[];
  participants: string[];
  isDeleted?: boolean;
  fileURL?: string;
  fileName?: string;
  fileType?: string;
};
