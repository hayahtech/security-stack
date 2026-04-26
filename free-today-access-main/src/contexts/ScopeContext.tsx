import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Scope } from '@/types';

interface ScopeContextType {
  scope: Scope;
  setScope: (scope: Scope) => void;
  toggleScope: () => void;
}

const ScopeContext = createContext<ScopeContextType | undefined>(undefined);

export function ScopeProvider({ children }: { children: ReactNode }) {
  const [scope, setScope] = useState<Scope>('business');
  const toggleScope = () => setScope(s => s === 'business' ? 'personal' : 'business');

  return (
    <ScopeContext.Provider value={{ scope, setScope, toggleScope }}>
      {children}
    </ScopeContext.Provider>
  );
}

export function useScope() {
  const ctx = useContext(ScopeContext);
  if (!ctx) throw new Error('useScope must be used within ScopeProvider');
  return ctx;
}
