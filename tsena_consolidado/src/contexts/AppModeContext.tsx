import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type AppMode = 'recepcao' | 'guarita' | null;

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  isSetupComplete: boolean;
}

const AppModeContext = createContext<AppModeContextType>({
  mode: null,
  setMode: () => {},
  isSetupComplete: false,
});

export const useAppMode = () => useContext(AppModeContext);

export const AppModeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<AppMode>(() => {
    const saved = localStorage.getItem('ros_mode');
    return (saved as AppMode) || null;
  });

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    if (newMode) {
      localStorage.setItem('ros_mode', newMode);
    } else {
      localStorage.removeItem('ros_mode');
    }
  };

  return (
    <AppModeContext.Provider value={{ mode, setMode, isSetupComplete: mode !== null }}>
      {children}
    </AppModeContext.Provider>
  );
};
