import React, { useEffect, useState } from 'react';
import { getStrategyOptimizationResults } from '../app/AllApiCalls';

interface OptimisationHistoryListProps {
  strategyId: string;
  onSelect: (id: string | number) => void;
  onClose: () => void;
}

export const OptimisationHistoryList: React.FC<OptimisationHistoryListProps> = ({ strategyId, onSelect, onClose }) => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOptimisationHistory, setShowOptimisationHistory] = useState(false);
  const [selectedOptimisationDetail, setSelectedOptimisationDetail] = useState(null);

  useEffect(() => {
    if (!strategyId) return;
    setLoading(true);
    getStrategyOptimizationResults(strategyId, { page: 1, page_size: 50 })
      .then(data => setResults(data.results || []))
      .finally(() => setLoading(false));
  }, [strategyId]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] overflow-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Previous Optimisations</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">&times;</button>
        </div>
        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-[#141721] text-white">
                <th className="px-2 py-2">ID</th>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Algorithm</th>
                <th className="px-2 py-2">Status</th>
                <th className="px-2 py-2">Final Equity</th>
              </tr>
            </thead>
            <tbody>
              {results.map((item) => (
                <tr
                  key={item.id}
                  className="bg-[#23263a] text-white cursor-pointer hover:bg-[#33374a]"
                  onClick={() => onSelect(item.id)}
                >
                  <td className="px-2 py-2">{item.id}</td>
                  <td className="px-2 py-2">{item.optimization_date ? new Date(item.optimization_date).toLocaleString() : '-'}</td>
                  <td className="px-2 py-2">{item.algorithm}</td>
                  <td className="px-2 py-2">{item.status}</td>
                  <td className="px-2 py-2">{item.final_equity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}; 