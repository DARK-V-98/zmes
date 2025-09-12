'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

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
    const moodDocRef = doc(db, 'settings', 'globalMood');
    
    const unsubscribe = onSnapshot(moodDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const newMood = docSnap.data().currentMood as Mood;
        if (newMood && THEME_MAP[newMood]) {
          setMoodState(newMood);
          document.body.className = THEME_MAP[newMood];
        }
      } else {
        // Set a default if it doesn't exist
        setDoc(moodDocRef, { currentMood: 'happy' });
      }
    });

    return () => unsubscribe();
  }, []);

  const setMood = useCallback(async (newMood: Mood) => {
    if (THEME_MAP[newMood]) {
      const moodDocRef = doc(db, 'settings', 'globalMood');
      try {
        await setDoc(moodDocRef, { currentMood: newMood });
        // The onSnapshot listener will handle the state update and theme change
      } catch (error) {
        console.error("Failed to update global mood:", error);
      }
    }
  }, []);
  
  return (
    <MoodContext.Provider value={{ mood, setMood }}>
      {children}
    </MoodContext.Provider>
  );
}

export const useMood = () => useContext(MoodContext);
