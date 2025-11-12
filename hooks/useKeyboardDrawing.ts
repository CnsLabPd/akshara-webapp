/**
 * Custom Hook for Keyboard Drawing Mode
 * Detects when the 'W' key is pressed and held
 */

import { useState, useEffect } from 'react';

export const useKeyboardDrawing = () => {
  const [isWKeyPressed, setIsWKeyPressed] = useState(false);

  useEffect(() => {
    // Track if key is already pressed to prevent repeat events
    let keyPressed = false;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if 'W' or 'w' key is pressed and not already registered
      if ((event.key === 'w' || event.key === 'W') && !keyPressed) {
        keyPressed = true;
        setIsWKeyPressed(true);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // Check if 'W' or 'w' key is released
      if (event.key === 'w' || event.key === 'W') {
        keyPressed = false;
        setIsWKeyPressed(false);
      }
    };

    // Handle window blur (user switches tabs/windows)
    const handleBlur = () => {
      keyPressed = false;
      setIsWKeyPressed(false);
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return { isWKeyPressed };
};
