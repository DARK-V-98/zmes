
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Mood = 'happy' | 'sad' | 'angry' | 'love' | 'surprised';

interface MoodContextType {
  mood: Mood;
  setMood: (mood: Mood) => void;
}

const MoodContext = createContext<MoodContextType>({
  mood: 'happy',
  setMood: () => {},
});

// This provider is now a simple state container and does not interact with Firestore.
// The ZMessenger component will be responsible for fetching and setting the mood
// for the specific conversation.
export function MoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMood] = useState<Mood>('happy');

  return (
    <MoodContext.Provider value={{ mood, setMood }}>
      {children}
    </MoodContext.Provider>
  );
}

export const useMood = () => useContext(MoodContext);
