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

export const users: User[] = [
  { id: 'user2', avatar: 'https://picsum.photos/seed/user2/200/200', name: 'Alice' },
  { id: 'user3', avatar: 'https://picsum.photos/seed/user3/200/200', name: 'Bob' },
  { id: 'user4', avatar: 'https://picsum.photos/seed/user4/200/200', name: 'Charlie' },
  { id: 'user5', avatar: 'https://picsum.photos/seed/user5/200/200', name: 'Diana' },
  { id: 'user6', avatar: 'https://picsum.photos/seed/user6/200/200', name: 'Ethan' },
];

export const messages: Message[] = [];
