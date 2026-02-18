import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Filter, Calendar, X, CheckCircle2, Clock, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import { BusinessRecord } from "@/types/business";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";

interface ResultsListProps {
  results: BusinessRecord[];
  initialSalesPersonFilter?: string | null;
  onClearSalespersonFilter?: () => void;
}

type SortField = "google_full_name" | "client_name" | "product" | "timestamp" | "progress" | "status";
type SortDir = "asc" | "desc";

const ResultsList = ({ results, initialSalesPersonFilter, onClearSalespersonFilter }: ResultsListProps) => {
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [salesPersonFilter, setSalesPersonFilter] = useState<string>(initialSalesPersonFilter || "all");
  const [contractLengthFilter, setContractLengthFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [sortField, setSortField] = useState<SortField>("timestamp");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filterOptions = useMemo(() => {
    const products = new Set<string>();
    const salesPersons = new Map<string, string>();
    const contractLengths = new Set<string>();

    results.forEach((record) => {
      if (record.product) products.add(record.product);
      if (record.google_id && record.google_full_name) {
        salesPersons.set(record.google_id, record.google_full_name);
      }
      if (record.contract_length) contractLengths.add(record.contract_length);
    });

    return {
      products: Array.from(products).sort(),
      salesPersons: Array.from(salesPersons.entries()).map(([id, name]) => ({ id, name })),
      contractLengths: Array.from(contractLengths).sort(),
    };
  }, [results]);

  const filteredAndSortedResults = useMemo(() => {
    const filtered = results.filter((record) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          record.client_name?.toLowerCase().includes(q) ||
          record.google_full_name?.toLowerCase().includes(q) ||
          record.product?.toLowerCase().includes(q) ||
          record.website_url?.toLowerCase().includes(q);
        if (!matchesSearch) return false;
      }
      if (productFilter !== "all" && record.product !== productFilter) return false;
      if (salesPersonFilter !== "all" && record.google_id !== salesPersonFilter) return false;
      if (contractLengthFilter !== "all" && record.contract_length !== contractLengthFilter) return false;
      if (dateFrom) {
        const recordDate = new Date(record.timestamp);
        if (recordDate < dateFrom) return false;
      }
      if (dateTo) {
        const recordDate = new Date(record.timestamp);
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (recordDate > endOfDay) return false;
      }
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "google_full_name":
          cmp = (a.google_full_name || "").localeCompare(b.google_full_name || "");
          break;
        case "client_name":
          cmp = (a.client_name || "").localeCompare(b.client_name || "");
          break;
        case "product":
          cmp = (a.product || "").localeCompare(b.product || "");
          break;
        case "timestamp":
          cmp = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case "progress":
          cmp = (a.total_steps > 0 ? a.step / a.total_steps : 0) - (b.total_steps > 0 ? b.step / b.total_steps : 0);
          break;
        case "status": {
          const aComplete = a.step >= a.total_steps ? 1 : 0;
          const bComplete = b.step >= b.total_steps ? 1 : 0;
          cmp = aComplete - bComplete;
          break;
        }
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [results, searchQuery, productFilter, salesPersonFilter, contractLengthFilter, dateFrom, dateTo, sortField, sortDir]);

  const clearFilters = () => {
    setSearchQuery("");
    setProductFilter("all");
    setSalesPersonFilter("all");
    setContractLengthFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    if (onClearSalespersonFilter) onClearSalespersonFilter();
  };

  const handleSalesPersonFilterChange = (value: string) => {
    setSalesPersonFilter(value);
    if (value === "all" && onClearSalespersonFilter) onClearSalespersonFilter();
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir(field === "timestamp" ? "desc" : "asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  const hasActiveFilters =
    searchQuery || productFilter !== "all" || salesPersonFilter !== "all" || contractLengthFilter !== "all" || dateFrom || dateTo;

  if (results.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">No results found. Try a different search.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy, HH:mm");
    } catch {
      return "N/A";
    }
  };

  const truncateUrl = (url: string, maxLength: number = 24) => {
    if (!url) return "Not specified";
    const clean = url.replace(/^https?:\/\/(www\.)?/, "");
    if (clean.length <= maxLength) return clean;
    return clean.substring(0, maxLength) + "…";
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Filters */}
      <div className="bg-white border border-border rounded-xl p-4 mb-4">
        <div className="flex flex-col gap-3">
          {/* Search + clear row */}
          <div className="flex gap-2 items-center">
            <Input
              type="text"
              placeholder="Filter results…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 h-9 bg-background"
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs text-muted-foreground shrink-0">
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Filter selects row */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />

            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {filterOptions.products.map((product) => (
                  <SelectItem key={product} value={product}>{product}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={salesPersonFilter} onValueChange={handleSalesPersonFilterChange}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue placeholder="Salesperson" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sales</SelectItem>
                {filterOptions.salesPersons.map(({ id, name }) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={contractLengthFilter} onValueChange={setContractLengthFilter}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue placeholder="Contract" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contracts</SelectItem>
                {filterOptions.contractLengths.map((length) => (
                  <SelectItem key={length} value={length}>{length}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1.5 ml-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
                    <Calendar className="mr-1.5 h-3 w-3" />
                    {dateFrom ? format(dateFrom, "dd/MM/yy") : "From"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>

              <span className="text-xs text-muted-foreground">–</span>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 text-xs font-normal">
                    <Calendar className="mr-1.5 h-3 w-3" />
                    {dateTo ? format(dateTo, "dd/MM/yy") : "To"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-xs text-muted-foreground mb-2 px-1">
        {filteredAndSortedResults.length} of {results.length} results
      </p>

      {/* Results Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/30">
                <TableHead className="font-medium cursor-pointer select-none" onClick={() => toggleSort("google_full_name")}>
                  <span className="flex items-center gap-1.5">Salesperson <SortIcon field="google_full_name" /></span>
                </TableHead>
                <TableHead className="font-medium cursor-pointer select-none" onClick={() => toggleSort("client_name")}>
                  <span className="flex items-center gap-1.5">Client <SortIcon field="client_name" /></span>
                </TableHead>
                <TableHead className="font-medium cursor-pointer select-none" onClick={() => toggleSort("product")}>
                  <span className="flex items-center gap-1.5">Product <SortIcon field="product" /></span>
                </TableHead>
                <TableHead className="font-medium">Website</TableHead>
                <TableHead className="font-medium cursor-pointer select-none" onClick={() => toggleSort("timestamp")}>
                  <span className="flex items-center gap-1.5">Updated <SortIcon field="timestamp" /></span>
                </TableHead>
                <TableHead className="font-medium cursor-pointer select-none" onClick={() => toggleSort("progress")}>
                  <span className="flex items-center gap-1.5">Progress <SortIcon field="progress" /></span>
                </TableHead>
                <TableHead className="font-medium cursor-pointer select-none" onClick={() => toggleSort("status")}>
                  <span className="flex items-center gap-1.5">Status <SortIcon field="status" /></span>
                </TableHead>
                <TableHead className="font-medium w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No results match your filters.</p>
                    <Button variant="link" size="sm" onClick={clearFilters} className="mt-1 text-xs">
                      Clear filters
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAndSortedResults.map((record) => {
                  const progressPercent = record.total_steps > 0 ? Math.round((record.step / record.total_steps) * 100) : 0;
                  const isComplete = record.step >= record.total_steps;

                  return (
                    <TableRow
                      key={record.id}
                      className="border-b border-border/60 hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/business/${record.id}`, { state: { record } })}
                    >
                      <TableCell className="font-medium text-foreground text-sm">
                        {record.google_full_name || "Unknown"}
                      </TableCell>
                      <TableCell className="text-foreground text-sm">{record.client_name || "Not recorded"}</TableCell>
                      <TableCell>
                        {record.product ? (
                          <span className="inline-flex px-2 py-0.5 rounded-full bg-primary/8 text-primary text-xs font-medium">
                            {record.product}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {record.website_url ? (
                          <a
                            href={record.website_url.startsWith("http") ? record.website_url : `https://${record.website_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex items-center gap-1 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {truncateUrl(record.website_url)}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap text-xs">
                        {formatDate(record.timestamp)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={progressPercent} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground whitespace-nowrap tabular-nums">
                            {record.step}/{record.total_steps}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isComplete
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {isComplete ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {isComplete ? "Complete" : "In Progress"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default ResultsList;
