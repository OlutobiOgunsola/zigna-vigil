import { createContext, useCallback, useEffect, useState } from 'react';

export const ThemeContext = createContext(null);

function getInitialTheme() {
  const stored = localStorage.getItem('vigil_theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('vigil_theme', theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), []);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
