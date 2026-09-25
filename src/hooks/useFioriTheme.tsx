import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Theme } from '../tokens';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'morning',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export interface FioriProviderProps {
  theme?: Theme;
  children: React.ReactNode;
}

export const FioriProvider: React.FC<FioriProviderProps> = ({
  theme: initialTheme = 'morning',
  children,
}) => {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default FioriProvider;
