import { createContext, useContext, useState, ReactNode } from 'react';

export type AppMode = 'analyst' | 'wonder';

interface ModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isWonder: boolean;
}

const ModeContext = createContext<ModeContextType>({
  mode: 'analyst',
  setMode: () => {},
  isWonder: false,
});

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<AppMode>('analyst');
  return (
    <ModeContext.Provider value={{ mode, setMode, isWonder: mode === 'wonder' }}>
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}
