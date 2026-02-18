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
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";

interface ResultsListProps {
  results: BusinessRecord[];
  initialSalesPersonFilter?: string | null;
  onClearSalespersonFilter?: () => void;
}

type SortField = "google_full_name" | "client_name" | "product" | "timestamp" | "progress" | "status" | "sessionType";
type SortDir = "asc" | "desc";

const ITEMS_PER_PAGE = 50;

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
  const [currentPage, setCurrentPage] = useState(1);

  const filterOptions = useMemo(() => {
    const products = new Set<string>();
    const contractLengths = new Set<string>();
    
    // Count sessions per salesperson name (like Overview page approach)
    const salesPersonCounts: Record<string, { pathfinder: number; kiss: number }> = {};

    results.forEach((record) => {
      if (record.product) products.add(record.product);
      if (record.contract_length) contractLengths.add(record.contract_length);
      
      const name = record.google_full_name;
      if (name) {
        if (!salesPersonCounts[name]) {
          salesPersonCounts[name] = { pathfinder: 0, kiss: 0 };
        }
        if (record._sessionType === "kiss") {
          salesPersonCounts[name].kiss++;
        } else {
          salesPersonCounts[name].pathfinder++;
        }
      }
    });

    // Filter: include if they have any Pathfinder entries OR more than 5 KISS entries
    const salesPersons = Object.entries(salesPersonCounts)
      .filter(([_, counts]) => counts.pathfinder > 0 || counts.kiss > 5)
      .map(([name]) => name)
      .sort();

    return {
      products: Array.from(products).sort(),
      salesPersons,
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
      if (salesPersonFilter !== "all" && record.google_full_name !== salesPersonFilter) return false;
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
        case "sessionType":
          cmp = (a._sessionType || "").localeCompare(b._sessionType || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return filtered;
  }, [results, searchQuery, productFilter, salesPersonFilter, contractLengthFilter, dateFrom, dateTo, sortField, sortDir]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredAndSortedResults.length / ITEMS_PER_PAGE));
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAndSortedResults.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAndSortedResults, currentPage]);

  // Reset page when filters change
  const resetPage = () => setCurrentPage(1);

  const clearFilters = () => {
    setSearchQuery("");
    setProductFilter("all");
    setSalesPersonFilter("all");
    setContractLengthFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
    setCurrentPage(1);
    if (onClearSalespersonFilter) onClearSalespersonFilter();
  };

  const handleSalesPersonFilterChange = (value: string) => {
    setSalesPersonFilter(value);
    setCurrentPage(1);
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
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
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

            <Select value={productFilter} onValueChange={(v) => { setProductFilter(v); setCurrentPage(1); }}>
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
                {filterOptions.salesPersons.map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={contractLengthFilter} onValueChange={(v) => { setContractLengthFilter(v); setCurrentPage(1); }}>
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
        Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedResults.length)} of {filteredAndSortedResults.length} results
      </p>

      {/* Results Table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/30">
                <TableHead className="font-medium cursor-pointer select-none" onClick={() => toggleSort("sessionType")}>
                  <span className="flex items-center gap-1.5">Type <SortIcon field="sessionType" /></span>
                </TableHead>
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
                <TableHead className="font-medium cursor-pointer select-none min-w-[120px]" onClick={() => toggleSort("status")}>
                  <span className="flex items-center gap-1.5">Status <SortIcon field="status" /></span>
                </TableHead>
                <TableHead className="font-medium w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <p className="text-muted-foreground text-sm">No results match your filters.</p>
                    <Button variant="link" size="sm" onClick={clearFilters} className="mt-1 text-xs">
                      Clear filters
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedResults.map((record) => {
                  const progressPercent = record.total_steps > 0 ? Math.round((record.step / record.total_steps) * 100) : 0;
                  const isComplete = record.step >= record.total_steps;
                  const isPathfinder = record._sessionType === "pathfinder";

                  return (
                    <TableRow
                      key={`${record._sessionType}-${record.id}`}
                      className={`border-b border-border/60 hover:bg-muted/30 transition-colors ${isPathfinder ? "cursor-pointer" : ""}`}
                      onClick={() => isPathfinder && navigate(`/business/${record.id}`, { state: { record } })}
                    >
                      <TableCell>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          isPathfinder
                            ? "bg-blue-50 text-blue-700"
                            : "bg-purple-50 text-purple-700"
                        }`}>
                          {isPathfinder ? "Pathfinder" : "KISS"}
                        </span>
                      </TableCell>
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
                        {record.website_url && record.website_url !== "N/A" ? (
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
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
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
                        {isPathfinder ? (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 7) return true;
                  if (page === 1 || page === totalPages) return true;
                  if (Math.abs(page - currentPage) <= 1) return true;
                  return false;
                })
                .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
                  if (idx > 0 && page - (arr[idx - 1] as number) > 1) acc.push("ellipsis");
                  acc.push(page);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        isActive={currentPage === item}
                        onClick={() => setCurrentPage(item as number)}
                        className="cursor-pointer"
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default ResultsList;
