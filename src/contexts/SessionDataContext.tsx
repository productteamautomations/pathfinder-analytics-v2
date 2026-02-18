import { createContext, useContext, useState, ReactNode } from "react";
import { BusinessRecord } from "@/types/business";

interface SessionDataState {
  results: BusinessRecord[];
  setResults: (results: BusinessRecord[]) => void;
  hasSearched: boolean;
  setHasSearched: (v: boolean) => void;
  salespersonFilter: string | null;
  setSalespersonFilter: (v: string | null) => void;
}

const SessionDataContext = createContext<SessionDataState | undefined>(undefined);

export const SessionDataProvider = ({ children }: { children: ReactNode }) => {
  const [results, setResults] = useState<BusinessRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [salespersonFilter, setSalespersonFilter] = useState<string | null>(null);

  return (
    <SessionDataContext.Provider value={{ results, setResults, hasSearched, setHasSearched, salespersonFilter, setSalespersonFilter }}>
      {children}
    </SessionDataContext.Provider>
  );
};

export const useSessionData = () => {
  const ctx = useContext(SessionDataContext);
  if (!ctx) throw new Error("useSessionData must be used within SessionDataProvider");
  return ctx;
};
