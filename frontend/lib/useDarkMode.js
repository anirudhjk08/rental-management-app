'use client';

import { useState, useEffect } from 'react';

export const useDarkMode = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check saved preference on load
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDark((prev) => {
      const newValue = !prev;
      localStorage.setItem('darkMode', newValue.toString());
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newValue;
    });
  };

  return { isDark, toggleDarkMode };
};