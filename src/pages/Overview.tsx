// src/pages/OverviewTotal.tsx
import { useState, useEffect, useMemo } from "react";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Loader2, CalendarIcon, BarChart3 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts";
import { useSessionData, DataEntry } from "@/contexts/SessionDataContext";

const OVERVIEW_WEBHOOK_URL = "https://n8n.addpeople.net/webhook/pathfinder-overview";
interface OverviewResponse {
  pathfinder?: DataEntry[];
  kiss?: DataEntry[];
}
const PRODUCT_COLORS: Record<string, string> = {
  "Lead Gen": "#1E3A8A",
  "Local SEO": "#3B82F6",
  LSA: "#93C5FD",
};

// Pathfinder team assignments
const PATHFINDER_INBOUND_TEAM = [
  "aaron.nixon@thrivemediagroup.co.uk",
  "hamid.hassan@thrivemediagroup.co.uk",
  "charlie.griffiths@thrivemediagroup.co.uk",
  "samuel.braniff@thrivemediagroup.co.uk",
];
const PATHFINDER_OUTBOUND_TEAM = [
  "joe.richardson@thrivemediagroup.co.uk",
  "wesley.mcdonald@thrivemediagroup.co.uk",
  "padraig.anglin@thrivemediagroup.co.uk",
  "tommy.macfarlane@thrivemediagroup.co.uk",
  "james.clarke@thrivemediagroup.co.uk",
];
const OverviewTotal = () => {
  const { overviewPathfinder: pathfinderData, setOverviewPathfinder: setPathfinderData, overviewKiss: kissData, setOverviewKiss: setKissData, overviewLoaded, setOverviewLoaded } = useSessionData();
  const [isLoading, setIsLoading] = useState(!overviewLoaded);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [boundFilter, setBoundFilter] = useState<string>("all");
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);

  // Fetch data on mount only if not cached
  useEffect(() => {
    if (!overviewLoaded) {
      fetchOverviewData();
    }
  }, []);
  const fetchOverviewData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(OVERVIEW_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      if (!response.ok) throw new Error("Failed to fetch overview data");
      const data: OverviewResponse[] = await response.json();
      const pathfinder = data.find((item) => item.pathfinder)?.pathfinder || [];
      const kiss = data.find((item) => item.kiss)?.kiss || [];
      setPathfinderData(pathfinder);
      setKissData(kiss);
      setOverviewLoaded(true);

      // Set default min/max dates
      const allDates = [...pathfinder, ...kiss].map((entry) => new Date(entry.timeCreated));
      if (allDates.length > 0) {
        const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime())));
        minDate.setHours(0, 0, 0, 0);
        maxDate.setHours(23, 59, 59, 999);
        setStartDate(minDate);
        setEndDate(maxDate);
      }
      toast({
        title: "Data loaded",
        description: `Loaded ${pathfinder.length} Pathfinder and ${kiss.length} KISS entries.`,
      });
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "Failed to load data",
        description: "There was an error fetching the overview data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to determine if a Pathfinder entry is inbound/outbound based on salesEmail
  const getPathfinderBound = (salesEmail: string | undefined): string | null => {
    if (!salesEmail) return null;
    const normalizedEmail = salesEmail.toLowerCase().trim();
    if (PATHFINDER_INBOUND_TEAM.some((email) => email.toLowerCase() === normalizedEmail)) return "inbound";
    if (PATHFINDER_OUTBOUND_TEAM.some((email) => email.toLowerCase() === normalizedEmail)) return "outbound";
    return null; // Unknown team member - will be included when filter is "all"
  };

  // Unique agents - only include those with >5 KISS entries or any Pathfinder entries
  const allAgents = useMemo(() => {
    const agentCounts: Record<string, { pathfinder: number; kiss: number }> = {};

    // Count entries per agent
    pathfinderData.forEach((entry) => {
      if (!agentCounts[entry.salesPerson]) {
        agentCounts[entry.salesPerson] = { pathfinder: 0, kiss: 0 };
      }
      agentCounts[entry.salesPerson].pathfinder++;
    });

    kissData.forEach((entry) => {
      if (!agentCounts[entry.salesPerson]) {
        agentCounts[entry.salesPerson] = { pathfinder: 0, kiss: 0 };
      }
      agentCounts[entry.salesPerson].kiss++;
    });

    // Filter agents: include if they have any Pathfinder entries OR more than 5 KISS entries
    const filteredAgents = Object.entries(agentCounts)
      .filter(([_, counts]) => counts.pathfinder > 0 || counts.kiss > 5)
      .map(([agent, _]) => agent)
      .sort();

    return filteredAgents;
  }, [pathfinderData, kissData]);

  // Filter Pathfinder data
  const filterPathfinderData = (data: DataEntry[]) => {
    return data.filter((entry) => {
      const entryDate = new Date(entry.timeCreated);
      let start = startDate ? new Date(startDate) : undefined;
      let end = endDate ? new Date(endDate) : undefined;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      if (start && entryDate < start) return false;
      if (end && entryDate > end) return false;
      if (agentFilter !== "all" && entry.salesPerson !== agentFilter) return false;

      // Bound filter for Pathfinder (based on salesEmail team assignment)
      if (boundFilter !== "all") {
        const entryBound = getPathfinderBound(entry.salesEmail);
        // If salesEmail isn't in any team list, exclude them when filtering by bound
        // If they are in a team, check if it matches the filter
        if (entryBound === null || entryBound !== boundFilter) return false;
      }
      return true;
    });
  };

  // Filter KISS data
  const filterKissData = (data: DataEntry[]) => {
    return data.filter((entry) => {
      const entryDate = new Date(entry.timeCreated);
      let start = startDate ? new Date(startDate) : undefined;
      let end = endDate ? new Date(endDate) : undefined;
      if (start) start.setHours(0, 0, 0, 0);
      if (end) end.setHours(23, 59, 59, 999);
      if (start && entryDate < start) return false;
      if (end && entryDate > end) return false;
      if (agentFilter !== "all" && entry.salesPerson !== agentFilter) return false;

      // Bound filter for KISS (based on bound field)
      if (boundFilter !== "all") {
        const entryBound = entry.bound?.toLowerCase().trim();
        // If no bound field or doesn't match filter, exclude
        if (!entryBound || entryBound !== boundFilter) return false;
      }
      return true;
    });
  };
  const filteredPathfinder = useMemo(() => {
    return filterPathfinderData(pathfinderData);
  }, [pathfinderData, startDate, endDate, agentFilter, boundFilter]);
  const filteredKiss = useMemo(() => {
    return filterKissData(kissData);
  }, [kissData, startDate, endDate, agentFilter, boundFilter]);

  // Combined data
  const combinedData = useMemo(() => [...filteredPathfinder, ...filteredKiss], [filteredPathfinder, filteredKiss]);

  // Product distribution
  const calculateProductDistribution = (data: DataEntry[]) => {
    const distribution: Record<string, number> = {
      "Lead Gen": 0,
      "Local SEO": 0,
      LSA: 0,
    };
    data.forEach((entry) => {
      if (distribution.hasOwnProperty(entry.product)) distribution[entry.product]++;
    });
    return Object.entries(distribution)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name,
        value,
        color: PRODUCT_COLORS[name],
      }));
  };
  const pathfinderDistribution = useMemo(() => calculateProductDistribution(filteredPathfinder), [filteredPathfinder]);
  const kissDistribution = useMemo(() => calculateProductDistribution(filteredKiss), [filteredKiss]);
  const combinedDistribution = useMemo(() => calculateProductDistribution(combinedData), [combinedData]);
  const clearFilters = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setAgentFilter("all");
    setBoundFilter("all");
  };
  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    setStartDateOpen(false);
  };
  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    setEndDateOpen(false);
  };
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="container py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Product Overview</h1>
            <p className="text-xs text-muted-foreground">Compare product distribution between Pathfinder and KISS</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-border rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Start Date</label>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[160px] justify-start text-left font-normal h-8 text-xs",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-2 border-b">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setStartDate(undefined); setStartDateOpen(false); }}>
                      All Time
                    </Button>
                  </div>
                  <Calendar mode="single" selected={startDate} onSelect={handleStartDateSelect} initialFocus disabled={(date) => (endDate ? date > endDate : false)} />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">End Date</label>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "w-[160px] justify-start text-left font-normal h-8 text-xs",
                      !endDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-1.5 h-3 w-3" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-2 border-b">
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setEndDate(undefined); setEndDateOpen(false); }}>
                      All Time
                    </Button>
                  </div>
                  <Calendar mode="single" selected={endDate} onSelect={handleEndDateSelect} initialFocus disabled={(date) => (startDate ? date < startDate : false)} />
                </PopoverContent>
              </Popover>
            </div>

            {/* Agent Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Agent</label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger className="w-[160px] h-8 text-xs">
                  <SelectValue placeholder="All Agents" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {allAgents.map((agent) => (
                    <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bound Filter */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Team Type</label>
              <Select value={boundFilter} onValueChange={setBoundFilter}>
                <SelectTrigger className="w-[140px] h-8 text-xs">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                  <SelectItem value="outbound">Outbound</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground h-8">
              Clear All
            </Button>
          </div>
        </div>

        {/* Charts */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Loading overview data…</span>
          </div>
        ) : (
          <>
            {/* Percentage Charts */}
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {/* Pathfinder Chart - Percentage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Pathfinder Distribution (%)</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {filteredPathfinder.length} entries
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pathfinderDistribution.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pathfinderDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {pathfinderDistribution.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* KISS Chart - Percentage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>KISS Distribution (%)</span>
                    <span className="text-sm font-normal text-muted-foreground">{filteredKiss.length} entries</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kissDistribution.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={kissDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {kissDistribution.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Combined Chart - Percentage */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Total Distribution (%)</span>
                    <span className="text-sm font-normal text-muted-foreground">{combinedData.length} entries</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {combinedDistribution.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={combinedDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {combinedDistribution.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Actual Value Charts */}
            <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Pathfinder Chart - Count */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Pathfinder Distribution</span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {filteredPathfinder.length} entries
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {pathfinderDistribution.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pathfinderDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ value }) => `${value}`}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {pathfinderDistribution.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* KISS Chart - Count */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>KISS Distribution</span>
                    <span className="text-sm font-normal text-muted-foreground">{filteredKiss.length} entries</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {kissDistribution.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={kissDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ value }) => `${value}`}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {kissDistribution.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Combined Chart - Count */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Total Distribution</span>
                    <span className="text-sm font-normal text-muted-foreground">{combinedData.length} entries</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {combinedDistribution.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={combinedDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ value }) => `${value}`}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {combinedDistribution.map((entry, index) => (
                              <Cell key={index} fill={entry.color} />
                            ))}
                          </Pie>
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
export default OverviewTotal;
