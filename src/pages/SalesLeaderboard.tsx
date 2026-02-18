import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { BusinessRecord, KissRawRecord, normalizeKissRecord } from "@/types/business";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, Trophy, Calendar, Filter, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useSessionData } from "@/contexts/SessionDataContext";

const ALL_SESSIONS_URL = "https://n8n.addpeople.net/webhook/7e3c68fb-a6bf-43a8-a339-oiu3294u23j";

interface SalespersonStats {
  google_id: string;
  name: string;
  totalSessions: number;
  averagePercentComplete: number;
  averageStep: number;
  sessions: BusinessRecord[];
}

const SalesLeaderboard = () => {
  const navigate = useNavigate();
  const { leaderboardSessions: sessions, setLeaderboardSessions: setSessions, leaderboardLoaded, setLeaderboardLoaded } = useSessionData();
  const [isLoading, setIsLoading] = useState(!leaderboardLoaded);
  const [selectedSalesperson, setSelectedSalesperson] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{from: Date | undefined;to: Date | undefined;}>({
    from: undefined,
    to: undefined
  });

  useEffect(() => {
    if (!leaderboardLoaded) {
      fetchAllSessions();
    }
  }, []);

  const fetchAllSessions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(ALL_SESSIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      if (Array.isArray(data)) {
        const pathfinderObj = data.find((item: any) => item.pathfinder);
        const kissObj = data.find((item: any) => item.kiss);
        if (pathfinderObj || kissObj) {
          const pathfinderRecords = (pathfinderObj?.pathfinder || []).map((r: any) => ({ ...r, _sessionType: "pathfinder" as const }));
          const kissRecords = (kissObj?.kiss || []).map((r: KissRawRecord) => normalizeKissRecord(r));
          setSessions([...pathfinderRecords, ...kissRecords]);
        } else {
          setSessions(data.map((r: any) => ({ ...r, _sessionType: "pathfinder" as const })));
        }
        setLeaderboardLoaded(true);
        toast({ title: "Leaderboard loaded", description: `Loaded ${data.length} sessions.` });
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({ title: "Failed to load leaderboard", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const salespeople = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach((s) => {if (s.google_id && s.google_full_name) map.set(s.google_id, s.google_full_name);});
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      if (dateRange.from || dateRange.to) {
        const d = new Date(session.timestamp || session.start_time);
        if (dateRange.from && d < dateRange.from) return false;
        if (dateRange.to) {
          const end = new Date(dateRange.to);
          end.setHours(23, 59, 59, 999);
          if (d > end) return false;
        }
      }
      if (selectedSalesperson !== "all" && session.google_id !== selectedSalesperson) return false;
      return true;
    });
  }, [sessions, dateRange, selectedSalesperson]);

  const leaderboardStats = useMemo(() => {
    const statsMap = new Map<string, SalespersonStats>();
    filteredSessions.forEach((session) => {
      const { google_id, google_full_name } = session;
      if (!google_id || !google_full_name) return;
      if (!statsMap.has(google_id)) {
        statsMap.set(google_id, { google_id, name: google_full_name, totalSessions: 0, averagePercentComplete: 0, averageStep: 0, sessions: [] });
      }
      const stats = statsMap.get(google_id)!;
      stats.sessions.push(session);
      stats.totalSessions++;
    });
    statsMap.forEach((stats) => {
      const totalPercent = stats.sessions.reduce((acc, s) => acc + s.step / s.total_steps * 100, 0);
      const totalSteps = stats.sessions.reduce((acc, s) => acc + s.step, 0);
      stats.averagePercentComplete = totalPercent / stats.totalSessions;
      stats.averageStep = totalSteps / stats.totalSessions;
    });
    return Array.from(statsMap.values()).sort((a, b) => b.averagePercentComplete - a.averagePercentComplete);
  }, [filteredSessions]);

  const earliestDate = useMemo(() => {
    if (sessions.length === 0) return null;
    const dates = sessions.map((s) => new Date(s.start_time)).filter((d) => !isNaN(d.getTime()));
    return dates.length > 0 ? new Date(Math.min(...dates.map((d) => d.getTime()))) : null;
  }, [sessions]);

  const formatDateRange = () => {
    if (dateRange.from && dateRange.to) return `${format(dateRange.from, "MMM d, yyyy")} – ${format(dateRange.to, "MMM d, yyyy")}`;
    if (dateRange.from) return `From ${format(dateRange.from, "MMM d, yyyy")}`;
    if (dateRange.to) return `Until ${format(dateRange.to, "MMM d, yyyy")}`;
    if (earliestDate) return `All time (since ${format(earliestDate, "MMM d, yyyy")})`;
    return "All time";
  };

  const getMedalStyle = (index: number) => {
    if (index === 0) return "bg-amber-400 text-amber-950";
    if (index === 1) return "bg-slate-300 text-slate-700";
    if (index === 2) return "bg-orange-400 text-orange-950";
    return "";
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading leaderboard…</p>
        </div>
      </div>);

  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Sales Leaderboard</h1>
              <p className="text-xs text-muted-foreground">{filteredSessions.length} sessions from {leaderboardStats.length} salespeople</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchAllSessions}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-center">
            














            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
                  <Calendar className="mr-1.5 h-3 w-3" />
                  {formatDateRange()}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-2 border-b">
                  <Button variant="ghost" size="sm" onClick={() => setDateRange({ from: undefined, to: undefined })} className="w-full text-xs">
                    Clear dates (all time)
                  </Button>
                </div>
                <CalendarComponent
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange.from}
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                  numberOfMonths={2} />

              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white border border-border rounded-xl">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-foreground text-sm">Progress Completion by Salesperson</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Average progress through the sales tool (8 steps)</p>
          </div>
          <div className="p-5">
            {leaderboardStats.length === 0 ?
            <div className="text-center py-12">
                <Trophy className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No data available for the selected filters.</p>
              </div> :

            <div className="space-y-5">
                {leaderboardStats.map((stats, index) =>
              <div key={stats.google_id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {index < 3 ?
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${getMedalStyle(index)}`}>
                            {index + 1}
                          </span> :

                    <span className="w-5 h-5 flex items-center justify-center text-xs text-muted-foreground font-medium">
                            {index + 1}
                          </span>
                    }
                        <span className="font-medium text-foreground text-sm">{stats.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-xs text-muted-foreground tabular-nums">
                          <span className="font-semibold text-foreground">{Math.round(stats.averagePercentComplete)}%</span>
                          {" · "}
                          <span>Avg {stats.averageStep.toFixed(1)}/8</span>
                          {" · "}
                          <span>{stats.totalSessions} session{stats.totalSessions !== 1 ? "s" : ""}</span>
                        </div>
                        <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => navigate(`/?salesperson=${stats.google_id}`)}>

                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                    <Progress value={stats.averagePercentComplete} className="h-1.5" />
                  </div>
              )}
              </div>
            }
          </div>
        </div>
      </div>
    </div>);

};

export default SalesLeaderboard;