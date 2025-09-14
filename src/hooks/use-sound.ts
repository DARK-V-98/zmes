
'use client';

import { useState, useEffect, useCallback } from 'react';

export function useSound(url: string, volume = 0.5) {
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audioInstance = new Audio(url);
    audioInstance.volume = volume;
    setAudio(audioInstance);
    
    return () => {
        // Cleanup audio element on unmount
        setAudio(null);
    }
  }, [url, volume]);

  const play = useCallback(() => {
    audio?.play().catch(error => console.error("Error playing sound:", error));
  }, [audio]);

  return play;
}
