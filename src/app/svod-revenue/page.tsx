'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Coins, 
  Calendar, 
  Play, 
  Download, 
  FileText, 
  Plus, 
  Search, 
  RefreshCw, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Film, 
  Users, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  X, 
  ArrowUpDown,
  Sparkles,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import { revenueService, TitleLedgerRecord, RunMonthlySplitResult } from '@/services/revenueService';
import { movieService, Movie } from '@/services/movieService';

// Helper to format seconds into HH:MM:SS or readable text
function formatSeconds(totalSeconds: number): string {
  if (!totalSeconds || isNaN(totalSeconds) || totalSeconds <= 0) return '0s';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.floor(totalSeconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  } else if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

// Generate default list of recent months (MM-YYYY)
function getRecentMonths(count = 12): string[] {
  const list: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    list.push(`${month}-${year}`);
  }
  return list;
}

export default function SvodRevenuePage() {
  const monthOptions = useMemo(() => getRecentMonths(12), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthOptions[0] || '09-2026');
  const [customMonthInput, setCustomMonthInput] = useState<string>('');
  
  // Data States
  const [ledger, setLedger] = useState<TitleLedgerRecord[]>([]);
  const [splitSummary, setSplitSummary] = useState<RunMonthlySplitResult | null>(null);
  const [moviesMap, setMoviesMap] = useState<Record<string, string>>({});
  
  // Loading & Action States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortField, setSortField] = useState<'revenue' | 'watch_time' | 'film_id'>('revenue');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal States
  const [isSubModalOpen, setIsSubModalOpen] = useState<boolean>(false);
  const [isSubmittingSub, setIsSubmittingSub] = useState<boolean>(false);
  const [subUserId, setSubUserId] = useState<string>('');
  const [subFee, setSubFee] = useState<string>('99.00');
  const [subGatewayFee, setSubGatewayFee] = useState<string>('2.50');

  // PDF Statement Modal State
  const [isPdfModalOpen, setIsPdfModalOpen] = useState<boolean>(false);
  const [rightsHolderName, setRightsHolderName] = useState<string>('Exit 44 Entertainment');

  // Fetch initial ledger and movie lookup table
  useEffect(() => {
    fetchMoviesLookup();
  }, []);

  useEffect(() => {
    if (selectedMonth) {
      loadLedgerData(selectedMonth);
    }
  }, [selectedMonth]);

  const fetchMoviesLookup = async () => {
    try {
      const moviesData = await movieService.getAll();
      if (Array.isArray(moviesData)) {
        const map: Record<string, string> = {};
        moviesData.forEach((m: Movie) => {
          if (m.id) map[String(m.id)] = m.movie_name || m.title || `Movie #${m.id}`;
          if (m.slug) map[m.slug] = m.movie_name || m.title || m.slug;
        });
        setMoviesMap(map);
      }
    } catch (err) {
      console.warn('Could not load movie lookup:', err);
    }
  };

  const loadLedgerData = async (monthYear: string) => {
    try {
      setIsLoading(true);
      const records = await revenueService.getTitleLedger(monthYear);
      setLedger(records || []);
    } catch (error: unknown) {
      console.error('Failed to load title ledger:', error);
      const errObj = error as { response?: { data?: { message?: string } } };
      toast.error(errObj?.response?.data?.message || 'Failed to fetch title ledger records');
      setLedger([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunMonthlySplit = async () => {
    const targetMonth = customMonthInput.trim() || selectedMonth;
    if (!targetMonth) {
      toast.error('Please select or specify a valid month (MM-YYYY)');
      return;
    }

    try {
      setIsCalculating(true);
      const result = await revenueService.runMonthlySplit(targetMonth);
      setSplitSummary(result);

      // Merge enriched calculation result with ledger records
      if (result && Array.isArray(result.titles_ledger)) {
        const enriched: TitleLedgerRecord[] = result.titles_ledger.map((item, idx) => ({
          id: idx + 1,
          film_id: item.film_id,
          month_year: result.month_year,
          total_allocated_revenue: item.total_allocated_revenue,
          updated_at: new Date().toISOString(),
          total_seconds_watched: item.total_seconds_watched,
          watch_percentage: item.watch_percentage,
          title_name: moviesMap[item.film_id] || item.film_id,
        }));
        setLedger(enriched);
      } else {
        await loadLedgerData(targetMonth);
      }

      toast.success(`Pro-Rata monthly split executed successfully for ${targetMonth}!`);
    } catch (error: unknown) {
      console.error('Failed to execute monthly split:', error);
      const errObj = error as { response?: { data?: { message?: string } } };
      toast.error(errObj?.response?.data?.message || 'Error executing monthly split calculation');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRecordUserSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subUserId.trim()) {
      toast.error('Please provide a valid User ID');
      return;
    }

    try {
      setIsSubmittingSub(true);
      await revenueService.recordUserSubscription({
        user_id: subUserId.trim(),
        subscription_fee: parseFloat(subFee) || 99.00,
        gateway_fee: parseFloat(subGatewayFee) || 2.50,
        month_year: selectedMonth,
      });

      toast.success(`User subscription recorded for ${selectedMonth}!`);
      setIsSubModalOpen(false);
      setSubUserId('');
      // Reload ledger
      loadLedgerData(selectedMonth);
    } catch (error: unknown) {
      console.error('Failed to record subscription:', error);
      const errObj = error as { response?: { data?: { message?: string } } };
      toast.error(errObj?.response?.data?.message || 'Failed to record subscription');
    } finally {
      setIsSubmittingSub(false);
    }
  };

  // Export CSV functionality
  const handleExportCSV = () => {
    if (!ledger || ledger.length === 0) {
      toast.error('No ledger data available to export');
      return;
    }

    const headers = [
      'Film ID',
      'Title Name',
      'Month Year',
      'Watch Time (Seconds)',
      'Watch Share (%)',
      'Allocated Payout (INR)',
      'Last Updated'
    ];

    const rows = filteredLedger.map((row) => {
      const filmTitle = row.title_name || moviesMap[row.film_id] || row.film_id;
      const watchSecs = row.total_seconds_watched || 0;
      const watchPct = row.watch_percentage || (totalPlatformSeconds > 0 ? `${((watchSecs / totalPlatformSeconds) * 100).toFixed(2)}%` : '0.00%');
      return [
        `"${row.film_id}"`,
        `"${filmTitle.replace(/"/g, '""')}"`,
        `"${row.month_year}"`,
        watchSecs,
        `"${watchPct}"`,
        row.total_allocated_revenue,
        `"${formatDate(row.updated_at)}"`
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SVOD_ProRata_Royalty_Statement_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Exported CSV statement for ${selectedMonth}!`);
  };

  // Metrics Calculations
  const totalDistributedRevenue = useMemo(() => {
    if (splitSummary?.total_revenue_allocated !== undefined) {
      return splitSummary.total_revenue_allocated;
    }
    return ledger.reduce((acc, curr) => acc + (Number(curr.total_allocated_revenue) || 0), 0);
  }, [ledger, splitSummary]);

  const totalPlatformSeconds = useMemo(() => {
    if (splitSummary?.total_platform_seconds_watched !== undefined) {
      return splitSummary.total_platform_seconds_watched;
    }
    return ledger.reduce((acc, curr) => acc + (curr.total_seconds_watched || 0), 0);
  }, [ledger, splitSummary]);

  // Enriched and Filtered Ledger Rows
  const filteredLedger = useMemo(() => {
    return ledger
      .map(item => {
        const titleName = item.title_name || moviesMap[item.film_id] || item.film_id;
        const watchSecs = item.total_seconds_watched || 0;
        const watchPct = item.watch_percentage || (totalPlatformSeconds > 0 ? `${((watchSecs / totalPlatformSeconds) * 100).toFixed(2)}%` : '0.00%');
        return {
          ...item,
          title_name: titleName,
          total_seconds_watched: watchSecs,
          watch_percentage: watchPct
        };
      })
      .filter(item => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return item.film_id.toLowerCase().includes(q) || item.title_name.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        let valA: number | string = a.total_allocated_revenue;
        let valB: number | string = b.total_allocated_revenue;
        if (sortField === 'watch_time') {
          valA = a.total_seconds_watched || 0;
          valB = b.total_seconds_watched || 0;
        } else if (sortField === 'film_id') {
          valA = a.film_id.toLowerCase();
          valB = b.film_id.toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [ledger, moviesMap, searchQuery, sortField, sortOrder, totalPlatformSeconds]);

  const toggleSort = (field: 'revenue' | 'watch_time' | 'film_id') => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center text-white shadow-md">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                SVOD Pro-Rata Revenue System
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  Executive Dashboard
                </span>
              </h1>
              <p className="text-sm text-muted-foreground">
                Pro-rata subscription pool allocation, title watch analytics, and rights holder royalty statements.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          <button
            onClick={() => setIsSubModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-all duration-200 border border-border"
          >
            <Plus className="w-4 h-4 text-primary" />
            <span>Record Subscription</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-all duration-200 border border-border"
          >
            <Download className="w-4 h-4 text-green-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsPdfModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-sm font-medium transition-all duration-200 border border-border"
          >
            <FileText className="w-4 h-4 text-blue-500" />
            <span>Royalty Statement (PDF)</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Month Selector & Split Trigger */}
      <div className="bg-card border border-border p-5 rounded-2xl shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <label className="text-sm font-medium text-foreground">Accounting Period:</label>
          </div>

          <select
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCustomMonthInput('');
            }}
            className="bg-background border border-border text-foreground px-4 py-2 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary transition-all"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {m} (Month {m})
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground uppercase font-semibold">Or Custom:</span>
            <input
              type="text"
              placeholder="MM-YYYY (e.g. 09-2026)"
              value={customMonthInput}
              onChange={(e) => setCustomMonthInput(e.target.value)}
              className="bg-background border border-border text-foreground px-3 py-1.5 rounded-xl text-sm w-44 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunMonthlySplit}
            disabled={isCalculating}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-gradient text-white font-medium text-sm shadow-lg shadow-primary/20 hover:opacity-90 transition-all duration-200 disabled:opacity-50"
          >
            {isCalculating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Revenue Split...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Monthly Revenue Split</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Platform Watch Time */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Watch Time</span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {formatSeconds(totalPlatformSeconds)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalPlatformSeconds.toLocaleString()} total watch seconds
            </div>
          </div>
        </div>

        {/* Card 2: Revenue Pool */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Net Pool</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-emerald-500">
              ₹ {totalDistributedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Active net subscription revenue pool
            </div>
          </div>
        </div>

        {/* Card 3: Distributed Payout */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Distributed Payout</span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-purple-400">
              ₹ {totalDistributedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Allocated across {ledger.length} active titles
            </div>
          </div>
        </div>

        {/* Card 4: Processed Stats */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-3 relative overflow-hidden group hover:border-primary/50 transition-all duration-300">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Processed Activity</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-foreground">
              {ledger.length} Titles
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {splitSummary?.users_processed_count !== undefined 
                ? `${splitSummary.users_processed_count} subscribers calculated` 
                : `Period: ${selectedMonth}`}
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Table Section */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
              Title Revenue Ledger & Royalty Breakdown
            </h2>
            <p className="text-sm text-muted-foreground">
              Pro-rata monthly payout allocations calculated per movie and series watch duration.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search film title or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border text-foreground pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              onClick={() => loadLedgerData(selectedMonth)}
              className="p-2.5 rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60 text-muted-foreground text-xs uppercase font-semibold border-b border-border">
                <tr>
                  <th className="px-5 py-4">
                    <button
                      onClick={() => toggleSort('film_id')}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      Film ID / Title Name
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-4">
                    <button
                      onClick={() => toggleSort('watch_time')}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                    >
                      Total Watch Time
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-4">Watch Share (%)</th>
                  <th className="px-5 py-4 text-right">
                    <button
                      onClick={() => toggleSort('revenue')}
                      className="flex items-center gap-1.5 hover:text-foreground transition-colors ml-auto"
                    >
                      Allocated Payout
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </button>
                  </th>
                  <th className="px-5 py-4 text-right">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span>Loading title revenue ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Film className="w-8 h-8 text-muted-foreground/40" />
                        <p className="font-medium text-foreground">No title ledger records found for {selectedMonth}</p>
                        <p className="text-xs text-muted-foreground">
                          Click "Run Monthly Revenue Split" above to calculate pro-rata payouts for this period.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredLedger.map((row) => {
                    const rawPct = parseFloat(row.watch_percentage.replace('%', '')) || 0;

                    return (
                      <tr key={row.id || row.film_id} className="hover:bg-muted/30 transition-colors">
                        {/* Title Name & ID */}
                        <td className="px-5 py-4 font-medium text-foreground">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              <Film className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">{row.title_name}</div>
                              <div className="text-xs text-muted-foreground font-mono">ID: {row.film_id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Watch Time */}
                        <td className="px-5 py-4 text-muted-foreground font-mono text-xs">
                          <div className="font-medium text-foreground">{formatSeconds(row.total_seconds_watched)}</div>
                          <div className="text-[11px] text-muted-foreground">({row.total_seconds_watched.toLocaleString()} secs)</div>
                        </td>

                        {/* Watch Percentage with progress bar */}
                        <td className="px-5 py-4">
                          <div className="space-y-1.5 max-w-[160px]">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-foreground">{row.watch_percentage}</span>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-brand-gradient rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(2, rawPct))}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Allocated Revenue Payout */}
                        <td className="px-5 py-4 text-right font-bold text-emerald-500 font-mono text-base">
                          ₹ {Number(row.total_allocated_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {/* Last Updated Timestamp */}
                        <td className="px-5 py-4 text-right text-xs text-muted-foreground">
                          {formatDate(row.updated_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL 1: Record User Subscription Fee */}
      {isSubModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Record User Subscription</h3>
                  <p className="text-xs text-muted-foreground">Add user subscription fee into the monthly pool</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSubModalOpen(false)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordUserSubscription} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  User ID / Account UUID *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. user_101 or 12"
                  value={subUserId}
                  onChange={(e) => setSubUserId(e.target.value)}
                  className="w-full bg-background border border-border text-foreground px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Subscription Fee (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={subFee}
                    onChange={(e) => setSubFee(e.target.value)}
                    className="w-full bg-background border border-border text-foreground px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                    Gateway Fee (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={subGatewayFee}
                    onChange={(e) => setSubGatewayFee(e.target.value)}
                    className="w-full bg-background border border-border text-foreground px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">
                  Accounting Month
                </label>
                <input
                  type="text"
                  disabled
                  value={selectedMonth}
                  className="w-full bg-muted border border-border text-muted-foreground px-4 py-2.5 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSubModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSub}
                  className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm flex items-center gap-2"
                >
                  {isSubmittingSub && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Executive PDF Royalty Statement View */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl max-w-3xl w-full p-8 shadow-2xl space-y-6 relative my-8 animate-in zoom-in-95 duration-200">
            {/* Header controls (Hidden during print) */}
            <div className="flex items-center justify-between border-b border-border pb-4 print:hidden">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Official Royalty Audit Statement</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print / Download PDF</span>
                </button>
                <button 
                  onClick={() => setIsPdfModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Statement Document Content */}
            <div className="space-y-6 p-4 bg-background border border-border rounded-xl print:border-none print:p-0">
              {/* Document Title Header */}
              <div className="flex justify-between items-start border-b border-border pb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center font-bold text-white text-sm">
                      P
                    </div>
                    <span className="text-xl font-bold tracking-tight text-foreground">PrimeTime SVOD Network</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Subscription Video-On-Demand (SVOD) Pro-Rata Royalty Distribution Statement
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-xs font-mono font-semibold text-primary uppercase bg-primary/10 px-2.5 py-1 rounded-full">
                    Statement #{selectedMonth}
                  </span>
                  <div className="text-xs text-muted-foreground pt-1">
                    Generated: {formatDate(new Date().toISOString())}
                  </div>
                </div>
              </div>

              {/* Rights Holder & Accounting Context */}
              <div className="grid grid-cols-2 gap-6 bg-muted/40 p-4 rounded-xl text-sm border border-border/50">
                <div>
                  <span className="text-xs uppercase font-semibold text-muted-foreground block mb-1">Rights Holder / Licensor:</span>
                  <input
                    type="text"
                    value={rightsHolderName}
                    onChange={(e) => setRightsHolderName(e.target.value)}
                    className="font-bold text-foreground bg-transparent border-b border-dashed border-border focus:outline-none focus:border-primary w-full text-base print:border-none"
                  />
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" /> Film Rights Holder Partner
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <span className="text-xs uppercase font-semibold text-muted-foreground block">Accounting Period:</span>
                  <div className="font-bold text-foreground text-base">{selectedMonth}</div>
                  <div className="text-xs text-muted-foreground">Currency: INR (₹)</div>
                </div>
              </div>

              {/* Summary Metrics Banner */}
              <div className="grid grid-cols-3 gap-4 border border-border p-4 rounded-xl text-center">
                <div>
                  <div className="text-xs text-muted-foreground">Total Platform Watch Time</div>
                  <div className="text-lg font-bold text-foreground">{formatSeconds(totalPlatformSeconds)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Net Subscription Revenue Pool</div>
                  <div className="text-lg font-bold text-emerald-500">₹ {totalDistributedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Total Royalty Payout</div>
                  <div className="text-lg font-bold text-purple-400">₹ {totalDistributedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                </div>
              </div>

              {/* Royalty Items Table */}
              <div className="border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted text-muted-foreground font-semibold uppercase">
                    <tr>
                      <th className="px-4 py-3">Film ID / Title</th>
                      <th className="px-4 py-3">Watch Time</th>
                      <th className="px-4 py-3">Watch Share (%)</th>
                      <th className="px-4 py-3 text-right">Allocated Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredLedger.map((row) => (
                      <tr key={row.film_id}>
                        <td className="px-4 py-2.5 font-medium text-foreground">
                          {row.title_name} <span className="text-muted-foreground font-mono">({row.film_id})</span>
                        </td>
                        <td className="px-4 py-2.5 font-mono">{formatSeconds(row.total_seconds_watched)}</td>
                        <td className="px-4 py-2.5 font-semibold">{row.watch_percentage}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-500 font-mono">
                          ₹ {Number(row.total_allocated_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted/80 font-bold border-t border-border text-foreground">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right uppercase text-xs">Total Net Royalty Payable:</td>
                      <td className="px-4 py-3 text-right font-mono text-sm text-emerald-500">
                        ₹ {totalDistributedRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures & Certification */}
              <div className="pt-8 grid grid-cols-2 gap-8 border-t border-border text-xs">
                <div className="space-y-4">
                  <div className="h-12 border-b border-dashed border-border" />
                  <div>
                    <div className="font-semibold text-foreground">Authorized Signature</div>
                    <div className="text-muted-foreground">PrimeTime SVOD Finance & Operations</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="h-12 border-b border-dashed border-border" />
                  <div>
                    <div className="font-semibold text-foreground">Rights Holder Acknowledgment</div>
                    <div className="text-muted-foreground">{rightsHolderName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
