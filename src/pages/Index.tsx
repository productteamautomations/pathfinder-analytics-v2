import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import SearchBar from "@/components/SearchBar";
import ResultsList from "@/components/ResultsList";
import { BusinessRecord } from "@/types/business";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const WEBHOOK_URL = "https://n8n.addpeople.net/webhook/7e3c68fb-a6bf-43a8-a339-92374h234h23g";
const ALL_SESSIONS_URL = "https://n8n.addpeople.net/webhook/7e3c68fb-a6bf-43a8-a339-oiu3294u23j";

const Index = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<BusinessRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [salespersonFilter, setSalespersonFilter] = useState<string | null>(null);

  useEffect(() => {
    const salespersonId = searchParams.get("salesperson");
    if (salespersonId) {
      setSalespersonFilter(salespersonId);
      loadSalespersonSessions(salespersonId);
    }
  }, []);

  const loadSalespersonSessions = async (salespersonId: string) => {
    setIsLoadingAll(true);
    setHasSearched(true);

    try {
      const response = await fetch(ALL_SESSIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (!response.ok) throw new Error("Failed to fetch sessions");

      const data = await response.json();

      if (Array.isArray(data)) {
        const filtered = data.filter((session: BusinessRecord) => session.google_id === salespersonId);
        setResults(filtered);
        const salespersonName = filtered[0]?.google_full_name || "Unknown";
        toast({
          title: `Sessions for ${salespersonName}`,
          description: `Found ${filtered.length} session${filtered.length !== 1 ? "s" : ""}.`
        });
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast({
        title: "Failed to load sessions",
        description: "There was an error fetching the data. Please try again.",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsLoadingAll(false);
    }
  };

  const clearSalespersonFilter = () => {
    setSalespersonFilter(null);
    setSearchParams({});
    setResults([]);
    setHasSearched(false);
  };

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query })
      });

      if (!response.ok) throw new Error("Failed to fetch results");

      const data = await response.json();

      if (Array.isArray(data)) {
        setResults(data);
        if (data.length === 0) {
          toast({ title: "No results found", description: "Try searching with different terms." });
        } else {
          toast({
            title: "Search complete",
            description: `Found ${data.length} result${data.length !== 1 ? "s" : ""}.`
          });
        }
      } else if (data.message) {
        toast({
          title: "Search initiated",
          description: "The search is processing. Please wait a moment and try again."
        });
        setResults([]);
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search failed",
        description: "There was an error processing your search. Please try again.",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchAll = async () => {
    setIsLoadingAll(true);
    setHasSearched(true);

    try {
      const response = await fetch(ALL_SESSIONS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      if (!response.ok) throw new Error("Failed to fetch all sessions");

      const data = await response.json();

      if (Array.isArray(data)) {
        setResults(data);
        toast({
          title: "All sessions loaded",
          description: `Found ${data.length} session${data.length !== 1 ? "s" : ""}.`
        });
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (error) {
      console.error("Fetch all sessions error:", error);
      toast({
        title: "Failed to load sessions",
        description: "There was an error fetching all sessions. Please try again.",
        variant: "destructive"
      });
      setResults([]);
    } finally {
      setIsLoadingAll(false);
    }
  };

  const showHero = !hasSearched && !isLoading && !isLoadingAll;

  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <div className="container py-8 md:py-12">
        {/* Hero — only visible before first search */}
        {showHero &&
        <div className="text-center mb-10 animate-fade-in">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl gradient-primary mb-4">
              <Search className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2 tracking-tight">Pathfinder Session Search

          </h1>
            <p className="text-muted-foreground max-w-md mx-auto">View detailed analytics and diagnostics.

          </p>
          </div>
        }

        {/* Search */}
        <div className="mb-4">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Load All button */}
        <div className="flex justify-center mb-8">
          <Button
            onClick={handleSearchAll}
            disabled={isLoadingAll}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground">

            {isLoadingAll ?
            <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Loading all sessions…
              </> :

            "or load all sessions"
            }
          </Button>
        </div>

        {/* Loading state */}
        {(isLoading || isLoadingAll) &&
        <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Searching…" : "Loading all sessions…"}
            </p>
          </div>
        }

        {/* Results */}
        {hasSearched && !isLoading && !isLoadingAll &&
        <div className="animate-fade-in">
            <ResultsList
            results={results}
            initialSalesPersonFilter={salespersonFilter}
            onClearSalespersonFilter={clearSalespersonFilter} />

          </div>
        }
      </div>
    </div>);

};

export default Index;