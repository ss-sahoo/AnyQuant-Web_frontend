import * as React from 'react';
import { useState } from 'react';

interface WalkForwardOptimisationViewProps {
  result: any; // The API response for walk forward optimisation
  onClose: () => void;
  isFullScreen?: boolean; // New prop to control full screen mode
}

export const WalkForwardOptimisationView: React.FC<WalkForwardOptimisationViewProps> = ({ result, onClose, isFullScreen = false }) => {
  const [tab, setTab] = useState<'results' | 'graph' | 'report'>('results');
  const [showStdout, setShowStdout] = useState(false);

  // Helper: parse equity/final results per generation from stdout
  const parseGenerations = (stdout: string) => {
    if (!stdout) return [];
    const genRegex = /Generation (\d+):\n Best individual:\(([^)]+)\); \n Equity Final \[\$\]:(\d+\.?\d*);/g;
    const generations: { generation: number; params: string; equity: string }[] = [];
    let match;
    while ((match = genRegex.exec(stdout)) !== null) {
      generations.push({
        generation: Number(match[1]),
        params: match[2],
        equity: match[3],
      });
    }
    return generations;
  };

  const generations = parseGenerations(result.stdout || '');
  const folds = result.optimized_parameters_per_fold || [];
  const plots: Record<string, string> = result.plots_html || {};

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
          Close
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        {/* Results Tab */}
        {tab === 'results' && (
          <>
            {/* Summary Stats */}
            <div className="mb-8">
              <div className="mb-4 text-lg font-semibold text-[#85e1fe]">Summary</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#141721] rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Status</div>
                  <div className="text-white font-semibold">{result.status}</div>
                </div>
                <div className="bg-[#141721] rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Execution Time</div>
                  <div className="text-white font-semibold">{result.execution_time}s</div>
                </div>
                <div className="bg-[#141721] rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">z-statistic</div>
                  <div className="text-white font-semibold">{result.z_statistic}</div>
                </div>
                <div className="bg-[#141721] rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">p-value</div>
                  <div className="text-white font-semibold">{result.p_value}</div>
                </div>
                <div className="bg-[#141721] rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Hypothesis Decision</div>
                  <div className="text-white font-semibold">{result.hypothesis_decision}</div>
                </div>
                <div className="bg-[#141721] rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Message</div>
                  <div className="text-white font-semibold">{result.message}</div>
                </div>
              </div>
            </div>

            {/* Folds Table */}
            {folds.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 text-lg font-semibold text-[#85e1fe]">Optimized Parameters per Fold</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border-separate border-spacing-y-2">
                    <thead>
                      <tr className="bg-[#1A1D2D] text-white">
                        <th className="px-2 py-2 text-left">Fold</th>
                        {folds.length > 0 && Object.keys(folds[0]).map((key) => (
                          <th key={key} className="px-2 py-2 text-left">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {folds.map((fold: any, idx: number) => (
                        <tr key={idx} className="bg-[#141721] text-white">
                          <td className="px-2 py-2">{idx + 1}</td>
                          {Object.values(fold).map((value: any, i: number) => (
                            <td key={i} className="px-2 py-2">{String(value)}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Generations Table */}
            {generations.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 text-lg font-semibold text-[#85e1fe]">Equity by Generation</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border-separate border-spacing-y-2">
                    <thead>
                      <tr className="bg-[#1A1D2D] text-white">
                        <th className="px-2 py-2 text-left">Generation</th>
                        <th className="px-2 py-2 text-left">Best Parameters</th>
                        <th className="px-2 py-2 text-left">Equity Final [$]</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generations.map((gen, idx) => (
                        <tr key={idx} className="bg-[#141721] text-white">
                          <td className="px-2 py-2">{gen.generation}</td>
                          <td className="px-2 py-2 max-w-[300px] truncate" title={gen.params}>{gen.params}</td>
                          <td className="px-2 py-2">{gen.equity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Stdout log */}
            {result.stdout && (
              <div className="mb-8">
                <button 
                  onClick={() => setShowStdout(!showStdout)} 
                  className="text-[#85e1fe] underline mb-4"
                >
                  {showStdout ? 'Hide' : 'Show'} Raw Log
                </button>
                {showStdout && (
                  <pre className="bg-[#141721] text-xs text-white rounded p-4 max-h-64 overflow-auto whitespace-pre-wrap">
                    {result.stdout}
                  </pre>
                )}
              </div>
            )}
          </>
        )}

        {/* Graph Tab */}
        {tab === 'graph' && (
          <div className="w-full grid grid-cols-1 gap-8">
            {Object.entries(plots).map(([name, html]) => {
              if (typeof html === 'string') {
                return (
                  <div key={name}>
                    <div className="mb-2 font-bold text-white text-base">{name}</div>
                    <iframe
                      title={name}
                      className="w-full h-[400px] bg-white"
                      style={{ border: 'none' }}
                      srcDoc={html}
                    />
                  </div>
                );
              }
              return null;
            })}
            {result.variable_trends_html && (
              <div>
                <div className="mb-2 font-bold text-white text-base">Variable Trends</div>
                <iframe
                  title="Variable Trends"
                  className="w-full h-[400px] bg-white"
                  style={{ border: 'none' }}
                  srcDoc={result.variable_trends_html}
                />
              </div>
            )}
          </div>
        )}

        {/* Report Tab */}
        {tab === 'report' && (
          <div>
            <div className="mb-6 text-2xl font-bold text-[#85e1fe] text-center">Walk Forward Analysis Report</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Column 1 */}
              <div>
                <div className="mb-2 flex flex-col gap-1">
                  {[
                    ['Status', result.status],
                    ['Execution Time', `${result.execution_time}s`],
                    ['z-statistic', result.z_statistic],
                    ['p-value', result.p_value],
                    ['Hypothesis Decision', result.hypothesis_decision],
                    ['Total Folds', folds.length],
                    ['Total Generations', generations.length],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-gray-800 py-1 text-sm">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Column 2 */}
              <div>
                <div className="mb-2 flex flex-col gap-1">
                  {[
                    ['Message', result.message],
                    ['Walk Forward ID', result.walkforward_optimization_id],
                    ['Best Fold', folds.length > 0 ? '1' : 'N/A'],
                    ['Average Parameters', folds.length > 0 ? Object.keys(folds[0]).length : 'N/A'],
                    ['Optimization Algorithm', 'Genetic Algorithm'],
                    ['Validation Method', 'Walk Forward'],
                    ['Statistical Significance', result.p_value < 0.05 ? 'Significant' : 'Not Significant'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-gray-800 py-1 text-sm">
                      <span className="text-gray-400">{label}</span>
                      <span className="text-white font-semibold">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 