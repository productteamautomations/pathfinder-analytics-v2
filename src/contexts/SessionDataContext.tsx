import { createContext, useContext, useState, ReactNode } from "react";
import { BusinessRecord } from "@/types/business";

interface DataEntry {
  timeCreated: string;
  salesPerson: string;
  salesEmail?: string;
  product: string;
  bound?: string;
}

interface SessionDataState {
  // Index page
  results: BusinessRecord[];
  setResults: (results: BusinessRecord[]) => void;
  hasSearched: boolean;
  setHasSearched: (v: boolean) => void;
  salespersonFilter: string | null;
  setSalespersonFilter: (v: string | null) => void;

  // Leaderboard page
  leaderboardSessions: BusinessRecord[];
  setLeaderboardSessions: (sessions: BusinessRecord[]) => void;
  leaderboardLoaded: boolean;
  setLeaderboardLoaded: (v: boolean) => void;

  // Overview page
  overviewPathfinder: DataEntry[];
  setOverviewPathfinder: (data: DataEntry[]) => void;
  overviewKiss: DataEntry[];
  setOverviewKiss: (data: DataEntry[]) => void;
  overviewLoaded: boolean;
  setOverviewLoaded: (v: boolean) => void;
}

const SessionDataContext = createContext<SessionDataState | undefined>(undefined);

export const SessionDataProvider = ({ children }: { children: ReactNode }) => {
  const [results, setResults] = useState<BusinessRecord[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [salespersonFilter, setSalespersonFilter] = useState<string | null>(null);

  const [leaderboardSessions, setLeaderboardSessions] = useState<BusinessRecord[]>([]);
  const [leaderboardLoaded, setLeaderboardLoaded] = useState(false);

  const [overviewPathfinder, setOverviewPathfinder] = useState<DataEntry[]>([]);
  const [overviewKiss, setOverviewKiss] = useState<DataEntry[]>([]);
  const [overviewLoaded, setOverviewLoaded] = useState(false);

  return (
    <SessionDataContext.Provider value={{
      results, setResults, hasSearched, setHasSearched, salespersonFilter, setSalespersonFilter,
      leaderboardSessions, setLeaderboardSessions, leaderboardLoaded, setLeaderboardLoaded,
      overviewPathfinder, setOverviewPathfinder, overviewKiss, setOverviewKiss, overviewLoaded, setOverviewLoaded,
    }}>
      {children}
    </SessionDataContext.Provider>
  );
};

export const useSessionData = () => {
  const ctx = useContext(SessionDataContext);
  if (!ctx) throw new Error("useSessionData must be used within SessionDataProvider");
  return ctx;
};

export type { DataEntry };
