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

export const loggedInUser: User = {
  id: 'user1',
  avatar: `https://picsum.photos/seed/user1/200/200`,
  name: 'You',
};

export const users: User[] = [
  { id: 'user2', avatar: 'https://picsum.photos/seed/user2/200/200', name: 'Alice' },
  { id: 'user3', avatar: 'https://picsum.photos/seed/user3/200/200', name: 'Bob' },
  { id: 'user4', avatar: 'https://picsum.photos/seed/user4/200/200', name: 'Charlie' },
  { id: 'user5', avatar: 'https://picsum.photos/seed/user5/200/200', name: 'Diana' },
  { id: 'user6', avatar: 'https://picsum.photos/seed/user6/200/200', name: 'Ethan' },
];

export const messages: Message[] = [
  {
    id: 'msg1',
    senderId: 'user2',
    receiverId: 'user1',
    content: 'Hey, how is it going?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
    reactions: [],
  },
  {
    id: 'msg2',
    senderId: 'user1',
    receiverId: 'user2',
    content: "Hi Alice! I'm doing great, thanks for asking. How about you?",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1.5),
    read: true,
    reactions: [{ emoji: '👍', userId: 'user2' }],
  },
  {
    id: 'msg3',
    senderId: 'user2',
    receiverId: 'user1',
    content: "I'm good too! Just working on the Z Messenger project. It's coming along nicely.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1),
    read: true,
    reactions: [],
  },
  {
    id: 'msg4',
    senderId: 'user1',
    receiverId: 'user2',
    content: "That's awesome to hear! Let me know if you need any help.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    read: true,
    reactions: [],
  },
    {
    id: 'msg5',
    senderId: 'user2',
    receiverId: 'user1',
    content: "Will do! I was wondering if you had a chance to look at the smart reply feature?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
    reactions: [],
  },
  {
    id: 'msg6',
    senderId: 'user3',
    receiverId: 'user1',
    content: 'Lunch tomorrow?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    read: true,
    reactions: [],
  },
    {
    id: 'msg7',
    senderId: 'user1',
    receiverId: 'user3',
    content: 'Sounds good! Where to?',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23),
    read: false,
    reactions: [],
  },
  {
    id: 'msg8',
    senderId: 'user4',
    receiverId: 'user1',
    content: "Here's the document you asked for.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48),
    read: true,
    reactions: [{ emoji: '🎉', userId: 'user1' }],
  },
   {
    id: 'msg9',
    senderId: 'user1',
    receiverId: 'user4',
    content: "Thanks, Charlie!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 47),
    read: true,
    reactions: [],
  },
  {
    id: 'msg10',
    senderId: 'user5',
    receiverId: 'user1',
    content: "Happy Birthday!",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72),
    read: false,
    reactions: [],
  },
  {
    id: 'msg11',
    senderId: 'user6',
    receiverId: 'user1',
    content: "Can we reschedule our meeting?",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
    reactions: [],
  }
];
