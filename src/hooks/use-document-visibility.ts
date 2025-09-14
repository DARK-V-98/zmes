
'use client';

import { useState, useEffect } from 'react';

export function useDocumentVisibility(): boolean {
  const [documentVisible, setDocumentVisible] = useState<boolean>(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setDocumentVisible(document.visibilityState === 'visible');
    };
    
    // Set initial state
    handleVisibilityChange();

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return documentVisible;
}
