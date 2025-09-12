'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';

export type Mood = 'happy' | 'sad' | 'angry' | 'love' | 'surprised';

const THEME_MAP: Record<Mood, string> = {
  happy: 'theme-blue',
  sad: 'theme-sad',
  angry: 'theme-angry',
  love: 'theme-love',
  surprised: 'theme-surprised',
};

interface MoodContextType {
  mood: Mood;
  setMood: (mood: Mood) => void;
}

const MoodContext = createContext<MoodContextType>({
  mood: 'happy',
  setMood: () => {},
});

export function MoodProvider({ children }: { children: ReactNode }) {
  const [mood, setMoodState] = useState<Mood>('happy');

  useEffect(() => {
    const storedMood = localStorage.getItem('app-mood') as Mood | null;
    if (storedMood && THEME_MAP[storedMood]) {
      setMoodState(storedMood);
      document.body.className = THEME_MAP[storedMood];
    } else {
        document.body.className = THEME_MAP['happy'];
    }
  }, []);

  const setMood = useCallback((newMood: Mood) => {
    if (THEME_MAP[newMood]) {
      localStorage.setItem('app-mood', newMood);
      setMoodState(newMood);
      document.body.className = THEME_MAP[newMood];
    }
  }, []);
  
  return (
    <MoodContext.Provider value={{ mood, setMood }}>
      {children}
    </MoodContext.Provider>
  );
}

export const useMood = () => useContext(MoodContext);
