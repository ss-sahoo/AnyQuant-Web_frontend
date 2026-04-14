import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getStrategyOptimizationResults } from '../app/AllApiCalls';

interface OptimisationHistoryListProps {
  strategyId: string;
  onSelect: (id: string | number) => void;
  onClose?: () => void;
  isInline?: boolean;
}

export const OptimisationHistoryList: React.FC<OptimisationHistoryListProps> = ({ strategyId, onSelect, onClose, isInline = false }) => {
  const router = useRouter();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleItemClick = (item: any) => {
    if (item.through_droplet) {
      // Redirect to optimization-results page for droplet optimizations
      router.push(`/optimization-results?job_id=${item.id}&type=droplet`);
      if (onClose) onClose(); // Close the modal
    } else {
      // Use the legacy onSelect handler for non-droplet optimizations
      onSelect(item.id);
    }
  };

  useEffect(() => {
    if (!strategyId) return;
    setLoading(true);
    setError(null);
    getStrategyOptimizationResults(strategyId, { page: 1, page_size: 50 })
      .then(data => {
        console.log("Optimization results data:", data);
        // Ensure we always set an array
        if (Array.isArray(data)) {
          setResults(data);
        } else if (data && Array.isArray(data.results)) {
          setResults(data.results);
        } else {
          setResults([]);
        }
      })
      .catch(err => {
        console.error("Error fetching optimization results:", err);
        setError(err?.message || "Failed to load optimization results");
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [strategyId]);

  const content = (
    <div className={isInline ? "w-full" : "bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-auto p-6"}>
      {!isInline && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Previous Optimisations</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl md:p-6">&times;</button>
        </div>
      )}
      {loading ? (
        <div className="text-center text-gray-400 py-8 text-sm">Loading optimization results...</div>
      ) : error ? (
        <div className="text-center text-red-400 py-8 text-sm">{error}</div>
      ) : results.length === 0 ? (
        <div className="text-center text-gray-500 py-8 text-sm font-medium uppercase tracking-[0.3em]">No optimization results found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-[10px]">
            <thead>
              <tr className="bg-[#141721] text-gray-400 font-black uppercase tracking-widest text-[9px]">
                <th className="px-4 py-3 text-left">ID</th>
                <th className="px-2 py-3 text-left">Date</th>
                <th className="px-2 py-3 text-left">Algorithm</th>
                <th className="px-2 py-3 text-left">Type</th>
                <th className="px-2 py-3 text-left">Status</th>
                <th className="px-2 py-3 text-left">Final Equity</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr
                  key={item.id}
                  className="bg-[#080A10] text-gray-300 cursor-pointer hover:bg-[#121420] border-t border-gray-900 transition-colors"
                  onClick={() => handleItemClick(item)}
                >
                  <td className="px-4 py-3 font-semibold text-white">{item.id}</td>
                  <td className="px-2 py-3">{item.optimization_date ? new Date(item.optimization_date).toLocaleString() : '-'}</td>
                  <td className="px-2 py-3">{item.algorithm}</td>
                  <td className="px-2 py-3">
                    {item.through_droplet ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-[#85e1fe]/10 text-[#85e1fe] border border-[#85e1fe]/30">
                        Droplet
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-gray-800 text-gray-400 border border-gray-700">
                        Legacy
                      </span>
                    )}
                  </td>
                  <td className={`px-2 py-3 font-bold ${item.status === 'completed' ? 'text-green-500' : 'text-yellow-500'}`}>{item.status}</td>
                  <td className="px-2 py-3 font-mono">${item.final_equity}</td>
                </tr>
              ))}
            </tbody>
          </table>
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