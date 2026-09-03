"use client"

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  getStrategyOptimizationResults,
  getStrategyWalkForwardOptimizationResults,
} from '../app/AllApiCalls';

interface OptimisationHistoryListProps {
  strategyId: string;
  onSelect: (id: string | number) => void;
  onClose?: () => void;
  isInline?: boolean;
  /**
   * Called instead of onSelect when the clicked run is still in progress.
   * The testing page uses it to bring the live progress panel into view; when
   * absent the list falls back to navigating there.
   */
  onSelectRunning?: () => void;
  /**
   * Changing this refetches the list. The page flips it when a run starts or
   * ends, so a row stops saying "running" as soon as it completes or fails.
   */
  refreshToken?: string | number;
  /**
   * A run in flight in this browser. The backend does not always write a row
   * for a job until it finishes, so surface it here regardless.
   */
  activeRun?: { kind: OptimisationKind; startedAt?: number } | null;
}

const RUNNING_STATUSES = ['running', 'started', 'pending', 'in_progress', 'queued'];

type OptimisationKind = 'regular' | 'walk_forward';

interface HistoryRow {
  id: number | string;
  kind: OptimisationKind;
  date: string | null;
  algorithm: string;
  status: string;
  finalEquity: number | null;
  throughDroplet: boolean;
  // Walk-forward only — the hypothesis test is the headline number there.
  pValue: number | null;
}

const PAGE_SIZE = 10;
const COLLAPSED_ROWS = 2;

const toRows = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.results)) return payload.results;
  return [];
};

const toTime = (value: string | null) => {
  if (!value) return 0;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

export const OptimisationHistoryList: React.FC<OptimisationHistoryListProps> = ({ strategyId, onSelect, onClose, isInline = false, onSelectRunning, refreshToken, activeRun }) => {
  const router = useRouter();
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!expanded) setPage(1);
  }, [expanded]);

  useEffect(() => {
    if (!strategyId) return;
    let isCancelled = false;
    setLoading(true);
    setError(null);

    // Regular and walk-forward runs live on separate endpoints. Fetch both and
    // merge, so one list covers everything the user has run for this strategy.
    // allSettled: a walk-forward endpoint that 404s must not blank the regular
    // history (and vice versa).
    Promise.allSettled([
      getStrategyOptimizationResults(strategyId, { page: 1, page_size: 50 }),
      getStrategyWalkForwardOptimizationResults(strategyId, { page: 1, page_size: 50 }),
    ])
      .then(([regularResult, walkForwardResult]) => {
        if (isCancelled) return;

        const regular: HistoryRow[] = (regularResult.status === 'fulfilled' ? toRows(regularResult.value) : [])
          .map((item: any) => ({
            id: item.id,
            kind: 'regular' as const,
            date: item.optimization_date || item.created_at || item.date || null,
            algorithm: item.algorithm || '-',
            status: item.status || '-',
            finalEquity: item.final_equity ?? null,
            throughDroplet: Boolean(item.through_droplet),
            pValue: null,
          }));

        const walkForward: HistoryRow[] = (walkForwardResult.status === 'fulfilled' ? toRows(walkForwardResult.value) : [])
          .map((item: any) => ({
            id: item.id,
            kind: 'walk_forward' as const,
            date: item.optimization_date || item.created_at || item.date || null,
            algorithm: item.algorithm || '-',
            status: item.status || '-',
            // Validation equity is the meaningful "result" for a WFO run.
            finalEquity: item.avg_validation_equity ?? item.final_equity ?? null,
            throughDroplet: Boolean(item.through_droplet),
            pValue: item.p_value ?? null,
          }));

        const merged = [...regular, ...walkForward].sort((a, b) => toTime(b.date) - toTime(a.date));
        setRows(merged);

        // Only surface an error when nothing at all could be loaded.
        if (merged.length === 0 && regularResult.status === 'rejected' && walkForwardResult.status === 'rejected') {
          setError((regularResult.reason as any)?.message || 'Failed to load optimisation history');
        }
      })
      .finally(() => {
        if (!isCancelled) setLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [strategyId, refreshToken]);

  const handleItemClick = (row: HistoryRow) => {
    // A run still in progress has no result to open. Send the user to where
    // the live progress is instead of a results page that would be empty.
    if (RUNNING_STATUSES.includes((row.status || '').toLowerCase())) {
      if (onSelectRunning) {
        onSelectRunning();
        if (onClose) onClose();
      } else {
        router.push('/strategy-testing');
      }
      return;
    }
    if (row.kind === 'walk_forward') {
      router.push(`/walk-forward-results?id=${row.id}`);
      if (onClose) onClose();
      return;
    }
    if (row.throughDroplet) {
      // Droplet runs are served by the dedicated results page
      router.push(`/optimization-results?job_id=${row.id}&type=droplet`);
      if (onClose) onClose();
      return;
    }
    onSelect(row.id);
  };

  const formatDate = (value: string | null) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (!Number.isFinite(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusColor = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'completed':
      case 'success':
        return 'bg-green-500/20 text-green-400';
      case 'failed':
      case 'error':
        return 'bg-red-500/20 text-red-400';
      case 'cancelled':
        return 'bg-yellow-500/20 text-yellow-400';
      case 'running':
      case 'started':
      case 'pending':
        return 'bg-blue-500/20 text-blue-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const allRows: HistoryRow[] = (() => {
    if (!activeRun) return rows;
    const alreadyListed = rows.some((row) => RUNNING_STATUSES.includes((row.status || '').toLowerCase()));
    if (alreadyListed) return rows;
    return [
      {
        id: 'in-flight',
        kind: activeRun.kind,
        date: activeRun.startedAt ? new Date(activeRun.startedAt).toISOString() : new Date().toISOString(),
        algorithm: '-',
        status: 'running',
        finalEquity: null,
        throughDroplet: false,
        pValue: null,
      },
      ...rows,
    ];
  })();

  const visibleRows = (() => {
    if (!expanded) return allRows.slice(0, COLLAPSED_ROWS);
    const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * PAGE_SIZE;
    return allRows.slice(start, start + PAGE_SIZE);
  })();

  const content = (
    <div className={isInline ? "w-full" : "bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-5xl max-h-[80vh] overflow-auto p-6"}>
      {!isInline && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Previous Optimisations</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl md:p-6">&times;</button>
        </div>
      )}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-[#85e1fe] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-center text-red-400 py-8 text-[10px] font-black uppercase tracking-widest">{error}</div>
      ) : allRows.length === 0 ? (
        <div className="text-center py-20 bg-[#141721] rounded-lg">
          <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">No previous optimisations</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-[10px] border-separate border-spacing-y-2">
            <thead>
              <tr className="bg-[#141721] text-gray-400 font-black uppercase tracking-widest text-[9px]">
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Kind</th>
                <th className="px-4 py-3 text-left">Algorithm</th>
                <th className="px-4 py-3 text-left">Run On</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Result</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr
                  key={`${row.kind}-${row.id}`}
                  className="bg-[#080A10] text-[#85e1fe] cursor-pointer hover:bg-[#121420] border-t border-gray-900 transition-all font-medium"
                  onClick={() => handleItemClick(row)}
                >
                  <td className="px-4 py-3 font-semibold text-white whitespace-nowrap">{formatDate(row.date)}</td>
                  <td className="px-4 py-3">
                    {row.kind === 'walk_forward' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-300 border border-purple-500/40 whitespace-nowrap">
                        Walk Forward
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-[#85e1fe]/10 text-[#85e1fe] border border-[#85e1fe]/30">
                        Regular
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-300">{row.algorithm}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                      row.throughDroplet
                        ? 'bg-[#85e1fe]/10 text-[#85e1fe] border-[#85e1fe]/30'
                        : 'bg-gray-800 text-gray-400 border-gray-700'
                    }`}>
                      {row.throughDroplet ? 'Droplet' : 'Legacy'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${statusColor(row.status)} border border-current opacity-80`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-white whitespace-nowrap">
                    {row.finalEquity != null ? `$${Number(row.finalEquity).toFixed(2)}` : '-'}
                    {row.kind === 'walk_forward' && row.pValue != null && (
                      <span className="ml-2 text-gray-500">p={Number(row.pValue).toFixed(4)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleItemClick(row);
                      }}
                      className="text-[#85e1fe] hover:text-white font-black uppercase text-[9px] tracking-widest"
                    >
                      {RUNNING_STATUSES.includes((row.status || '').toLowerCase()) ? 'View progress' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {allRows.length > COLLAPSED_ROWS && (
            <div className="flex flex-col items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141721] hover:bg-[#1f2335] border border-gray-700 text-gray-300 text-[9px] font-black uppercase tracking-widest transition-colors"
                aria-expanded={expanded}
                aria-label={expanded ? 'Show fewer optimisations' : `Show all ${allRows.length} optimisations`}
              >
                {expanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {expanded ? 'Show less' : `Show all (${allRows.length})`}
              </button>
              {expanded && allRows.length > PAGE_SIZE && (() => {
                const totalPages = Math.max(1, Math.ceil(allRows.length / PAGE_SIZE));
                const currentPage = Math.min(page, totalPages);
                const start = (currentPage - 1) * PAGE_SIZE;
                const end = Math.min(start + PAGE_SIZE, allRows.length);
                return (
                  <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-widest">
                    <span className="text-gray-500">{start + 1}–{end} of {allRows.length}</span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#141721] hover:bg-[#1f2335] border border-gray-700 text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-3 h-3" />
                      Prev
                    </button>
                    <span className="text-gray-400">Page {currentPage} / {totalPages}</span>
                    <button
                      type="button"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#141721] hover:bg-[#1f2335] border border-gray-700 text-gray-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Next page"
                    >
                      Next
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isInline) return content;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      {content}
    </div>
  );
};
