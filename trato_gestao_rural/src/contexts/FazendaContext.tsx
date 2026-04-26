import React, { createContext, useContext, useState, useCallback } from "react";

export interface Fazenda {
  id: string;
  name: string;
  city: string;
  state: string;
  area_ha: number;
  type: "corte" | "leite" | "misto" | "suino" | "avicola";
  notes: string;
  pastures_count: number;
  animals_count: number;
}

export const mockFazendas: Fazenda[] = [
  { id: "faz-1", name: "Fazenda Boa Vista", city: "Uberaba", state: "MG", area_ha: 320, type: "misto", notes: "Sede principal", pastures_count: 6, animals_count: 8 },
  { id: "faz-2", name: "Fazenda São José", city: "Ribeirão Preto", state: "SP", area_ha: 180, type: "corte", notes: "Confinamento", pastures_count: 3, animals_count: 2 },
  { id: "faz-3", name: "Sítio Esperança", city: "Goiânia", state: "GO", area_ha: 45, type: "leite", notes: "Produção leiteira", pastures_count: 2, animals_count: 0 },
];

export const typeLabels: Record<Fazenda["type"], string> = {
  corte: "Corte",
  leite: "Leite",
  misto: "Misto",
  suino: "Suíno",
  avicola: "Avícola",
};

interface FazendaContextType {
  fazendas: Fazenda[];
  activeFazenda: Fazenda | null;
  setActiveFazendaId: (id: string | null) => void;
}

const FazendaContext = createContext<FazendaContextType | undefined>(undefined);

export function FazendaProvider({ children }: { children: React.ReactNode }) {
  const [fazendas] = useState<Fazenda[]>(mockFazendas);
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem("activeFazendaId") || mockFazendas[0].id,
  );

  const activeFazenda = fazendas.find((f) => f.id === activeId) || null;

  const setActiveFazendaId = useCallback((id: string | null) => {
    setActiveId(id);
    if (id) localStorage.setItem("activeFazendaId", id);
    else localStorage.removeItem("activeFazendaId");
  }, []);

  return (
    <FazendaContext.Provider value={{ fazendas, activeFazenda, setActiveFazendaId }}>
      {children}
    </FazendaContext.Provider>
  );
}

export function useFazenda() {
  const ctx = useContext(FazendaContext);
  if (!ctx) throw new Error("useFazenda must be used within FazendaProvider");
  return ctx;
}
