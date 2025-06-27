import React, { useState, useEffect } from 'react';
import { getStrategyOptimizationResults } from '../app/AllApiCalls';

interface PreviousOptimisationViewProps {
  optimisationResults?: any[]; // Each item is the full API result.result object
  onClose: () => void;
  strategyId?: string | null;
  isFullScreen?: boolean; // New prop to control full screen mode
}

export const PreviousOptimisationView: React.FC<PreviousOptimisationViewProps> = ({ 
  optimisationResults, 
  onClose, 
  strategyId,
  isFullScreen = false 
}) => {
  const [tab, setTab] = useState<'results' | 'graph' | 'report'>('results');
  const [selectedResultIdx, setSelectedResultIdx] = useState(0);
  const [checkedRows, setCheckedRows] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(false);
  const [listResults, setListResults] = useState<any[]>([]);
  
  // Fetch previous optimisations if strategyId is provided
  useEffect(() => {
    if (strategyId) {
      setLoading(true);
      getStrategyOptimizationResults(strategyId, { page: 1, page_size: 50 })
        .then(data => setListResults(data.results || []))
        .finally(() => setLoading(false));
    }
  }, [strategyId]);

  // Always use the latest result by default
  useEffect(() => {
    if (optimisationResults && optimisationResults.length > 0) {
      setSelectedResultIdx(optimisationResults.length - 1);
    }
  }, [optimisationResults]);

  if (strategyId) {
    // List view for previous optimisations
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
                {listResults.map((item) => (
                  <tr key={item.id} className="bg-[#23263a] text-white">
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
  }

  const selectedResult = (optimisationResults || [])[selectedResultIdx] || {};
  
  // Handle both old and new API response structures
  const previewRows = selectedResult.optimisation_preview || selectedResult.full_optimization_results || [];
  const heatmapHtml = selectedResult.heatmap_plot_html || selectedResult.plots_html?.['optimise_plot.html'];
  const tradesPlotHtml = selectedResult.trades_plot_html || selectedResult.plots_html?.['Plotly.html'];

  // Handler for checkboxes
  const handleCheckbox = (idx: number) => {
    setCheckedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Helper: get value or dash
  const get = (row: any, key: string) => row[key] ?? '-';

  // Use full screen layout when isFullScreen is true
  const containerClass = isFullScreen 
    ? "fixed inset-0 bg-[#000] text-white flex flex-col z-50" 
    : "ml-[64px] w-full min-h-screen bg-[#000] text-white flex flex-col";

  return (
    <div className={containerClass}>
      {/* Sticky Full-Width Tab Bar */}
      <div className="sticky top-0 z-20 w-full bg-[#000]">
        <div className="flex w-full items-center px-8" style={{ minHeight: 48 }}>
          <div className="flex flex-1">
            {['results', 'graph', 'report'].map((t) => (
              <button
                key={t}
                className={`flex-1 py-2 text-lg font-semibold transition-colors duration-200
                  ${tab === t
                    ? 'bg-[#000] text-[#85e1fe]'
                    : 'bg-[#141721] text-gray-400'
                  }`}
                onClick={() => setTab(t as any)}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      {/* Save Button below tab bar, right-aligned */}
      <div className="px-20 pb-4 flex justify-end">
        <button onClick={onClose} className="bg-[#85e1fe] text-black px-3 py-1.5 rounded-md hover:bg-[#6bcae2] font-medium mt-2 text-sm">
          Save results of optimisation
        </button>
      </div>
      {/* Content */}
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        {/* Results Tab */}
        {tab === 'results' && (
          <>
            {(!previewRows || previewRows.length === 0) ? (
              <div className="text-center text-gray-400 py-8">
                Waiting for optimisation result...
              </div>
            ) : (
              <div className="overflow-x-auto mb-8">
                <table className="min-w-full text-xs border-separate border-spacing-y-2">
                  <thead>
                    <tr className="bg-[#000] text-white font-bold">
                      <th className="px-2 py-2 text-left">Pass</th>
                      <th className="px-2 py-2 text-left">Equity Final [$]</th>
                      <th className="px-2 py-2 text-left">Return [%]</th>
                      <th className="px-2 py-2 text-left">Profit Factor</th>
                      <th className="px-2 py-2 text-left">Drawdown %</th>
                      <th className="px-2 py-2 text-left">Win Rate [%]</th>
                      <th className="px-2 py-2 text-left"># Trades</th>
                      <th className="px-2 py-2 text-left">Inputs</th>
                      <th className="px-2 py-2 text-left"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row: any, idx: number) => (
                      <tr
                        key={idx}
                        className="bg-[#000] text-white"
                      >
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={!!checkedRows[idx]}
                              onChange={() => handleCheckbox(idx)}
                              className="accent-[#85e1fe] w-4 h-4"
                            />
                            <span className="font-medium">{idx + 1}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2">{get(row, 'Equity Final [$]')}</td>
                        <td className="px-2 py-2">{get(row, 'Return [%]')}</td>
                        <td className="px-2 py-2">{get(row, 'Profit Factor')}</td>
                        <td className="px-2 py-2">{get(row, 'Max. Drawdown [%]')}</td>
                        <td className="px-2 py-2">{get(row, 'Win Rate [%]')}</td>
                        <td className="px-2 py-2">{get(row, '# Trades')}</td>
                        <td className="px-2 py-2 max-w-[200px] truncate" title={JSON.stringify(row)}>
                          {Object.entries(row)
                            .filter(([k]) => k.startsWith('param_'))
                            .map(([k, v]) => `${k}: ${v}`)
                            .join(', ')}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <button className="p-1">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="12" cy="5" r="1.5" fill="#fff"/>
                              <circle cx="12" cy="12" r="1.5" fill="#fff"/>
                              <circle cx="12" cy="19" r="1.5" fill="#fff"/>
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {/* Scatter Plot Section */}
            <div className="mb-2 font-bold text-white text-base">Scatter Plot</div>
            {heatmapHtml && (
              <div className="w-full bg-white">
                <iframe
                  title="Scatter Plot"
                  className="w-full h-[300px]"
                  style={{ border: 'none', background: 'white' }}
                  srcDoc={heatmapHtml}
                />
              </div>
            )}
          </>
        )}
        {/* Graph Tab */}
        {tab === 'graph' && (
          <div className="w-full grid grid-cols-1 gap-8">
            {heatmapHtml && (
              <div>
                <div className="mb-2 font-bold text-white text-base">Scatter Plot</div>
                <iframe
                  title="Optimisation Scatter Plot"
                  className="w-full h-[400px] bg-white"
                  style={{ border: 'none' }}
                  srcDoc={heatmapHtml}
                />
              </div>
            )}
            {tradesPlotHtml && (
              <div>
                <div className="mb-2 font-bold text-white text-base">Trades Plot</div>
                <iframe
                  title="Trades Plot"
                  className="w-full h-[400px] bg-white"
                  style={{ border: 'none' }}
                  srcDoc={tradesPlotHtml}
                />
              </div>
            )}
          </div>
        )}
        {/* Report Tab */}
        {tab === 'report' && (
          <div>
            <div className="mb-6 text-2xl font-bold text-[#85e1fe] text-center">Report</div>
            {(() => {
              const preview = selectedResult.optimisation_preview?.[0] || selectedResult.full_optimization_results?.[0] || {};
              return (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Column 1 */}
                  <div>
                    {[
                      ['Start', preview['Start']],
                      ['End', preview['End']],
                      ['Duration', preview['Duration']],
                      ['Exposure Time (%)', preview['Exposure Time [%]']],
                      ['Equity Final ($)', preview['Equity Final [$]']],
                      ['Equity Peak ($)', preview['Equity Peak [$]']],
                      ['Return (%)', preview['Return [%]']],
                      ['Buy & Hold Return (%)', preview['Buy & Hold Return [%]']],
                      ['Return (Ann.) [%]', preview['Return (Ann.) [%]']],
                      ['Volatility (Ann.) [%]', preview['Volatility (Ann.) [%]']],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b border-gray-800 py-1 text-sm">
                        <span className="text-gray-400">{label}</span>
                        <span className="text-white font-semibold">{value ?? '-'}</span>
                      </div>
                    ))}
                  </div>
                  {/* Column 2 */}
                  <div>
                    {[
                      ['Sharpe Ratio', preview['Sharpe Ratio']],
                      ['Sortino Ratio', preview['Sortino Ratio']],
                      ['Calmar Ratio', preview['Calmar Ratio']],
                      ['Max. Drawdown (%)', preview['Max. Drawdown [%]']],
                      ['Avg. Drawdown (%)', preview['Avg. Drawdown [%]']],
                      ['Max. Drawdown Duration', preview['Max. Drawdown Duration']],
                      ['Avg. Drawdown Duration', preview['Avg. Drawdown Duration']],
                      ['# Trades', preview['# Trades']],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b border-gray-800 py-1 text-sm">
                        <span className="text-gray-400">{label}</span>
                        <span className="text-white font-semibold">{value ?? '-'}</span>
                      </div>
                    ))}
                  </div>
                  {/* Column 3 */}
                  <div>
                    {[
                      ['Win Rate (%)', preview['Win Rate [%]']],
                      ['Best Trade (%)', preview['Best Trade [%]']],
                      ['Worst Trade (%)', preview['Worst Trade [%]']],
                      ['Avg. Trade (%)', preview['Avg. Trade [%]']],
                      ['Max. Trade Duration', preview['Max. Trade Duration']],
                      ['Avg. Trade Duration', preview['Avg. Trade Duration']],
                      ['Profit Factor', preview['Profit Factor']],
                      ['Expectancy (%)', preview['Expectancy [%]']],
                      ['SQN', preview['SQN']],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between border-b border-gray-800 py-1 text-sm">
                        <span className="text-gray-400">{label}</span>
                        <span className="text-white font-semibold">{value ?? '-'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}; 