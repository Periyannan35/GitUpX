import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-black text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 text-xs font-medium transition-colors focus:outline-none"
    >
      {theme === 'dark' ? (
        <>
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </>
      )}
    </button>
  );
}
