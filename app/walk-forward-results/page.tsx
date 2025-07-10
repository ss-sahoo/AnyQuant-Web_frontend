'use client'

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getWalkForwardOptimizationResultDetail } from '../AllApiCalls';

interface WalkForwardResultsPageProps {
  // This will be populated from URL params or state
}

export default function WalkForwardResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'results' | 'graph' | 'report'>('results');
  const [showStdout, setShowStdout] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [checkedRows, setCheckedRows] = useState<{ [key: number]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Get result from URL params, sessionStorage, or fetch by ID
  useEffect(() => {
    const resultParam = searchParams.get('result');
    const idParam = searchParams.get('id');
    
    if (resultParam) {
      try {
        setResult(JSON.parse(decodeURIComponent(resultParam)));
      } catch (error) {
        console.error('Error parsing result from URL:', error);
      }
    } else if (idParam) {
      // Fetch the result by ID
      const fetchResult = async () => {
        try {
          setIsLoading(true);
          console.log('Fetching WFO result by ID:', idParam);
          const data = await getWalkForwardOptimizationResultDetail(parseInt(idParam));
          console.log('Fetched WFO result:', data);
          setResult(data);
        } catch (error) {
          console.error('Error fetching WFO result by ID:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchResult();
    } else {
      // Check sessionStorage for optimization ID or minimal data
      const optimizationId = sessionStorage.getItem('walkForwardOptimizationId');
      const minimalData = sessionStorage.getItem('walkForwardMinimalData');
      
      if (optimizationId) {
        // Fetch the result by optimization ID
        const fetchResult = async () => {
          try {
            setIsLoading(true);
            console.log('Fetching WFO result by optimization ID:', optimizationId);
            const data = await getWalkForwardOptimizationResultDetail(parseInt(optimizationId));
            console.log('Fetched WFO result:', data);
            setResult(data);
            // Clear the sessionStorage after successful fetch
            sessionStorage.removeItem('walkForwardOptimizationId');
          } catch (error) {
            console.error('Error fetching WFO result by optimization ID:', error);
          } finally {
            setIsLoading(false);
          }
        };
        fetchResult();
      } else if (minimalData) {
        try {
          const parsedData = JSON.parse(minimalData);
          console.log('Using minimal data from sessionStorage:', parsedData);
          setResult(parsedData);
          // Clear the sessionStorage after using
          sessionStorage.removeItem('walkForwardMinimalData');
        } catch (error) {
          console.error('Error parsing minimal data from sessionStorage:', error);
        }
      } else {
        // Fallback to localStorage - check both keys (for backward compatibility)
        const storedResult = localStorage.getItem('walkForwardResult') || localStorage.getItem('walkForwardResultDetail');
        if (storedResult) {
          try {
            setResult(JSON.parse(storedResult));
          } catch (error) {
            console.error('Error parsing result from localStorage:', error);
          }
        }
      }
    }
  }, [searchParams]);

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

  // Handler for checkboxes
  const handleCheckbox = (idx: number) => {
    setCheckedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Helper: get value or dash
  const get = (row: any, key: string) => row[key] ?? '-';

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#000] text-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#85e1fe] mb-4">Loading Walk Forward Results...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#85e1fe] mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="fixed inset-0 bg-[#000] text-white flex items-center justify-center z-50">
        <div className="text-center">
          <div className="text-2xl font-bold text-[#85e1fe] mb-4">No Walk Forward Results Found</div>
          <button 
            onClick={() => router.push('/strategy-testing')}
            className="bg-[#85e1fe] text-black px-6 py-3 rounded-md hover:bg-[#6bcae2] font-medium"
          >
            Go Back to Strategy Testing
          </button>
        </div>
      </div>
    );
  }

  const generations = parseGenerations(result.stdout || '');
  const folds = result.optimized_parameters_per_fold || [];
  const foldResults = result.fold_results || [];
  const plots: Record<string, string> = result.plots_html || {};

  return (
    <div className="fixed inset-0 bg-[#000] text-white flex flex-col z-50">
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
        <button 
          onClick={() => router.push('/strategy-testing')} 
          className="bg-[#85e1fe] text-black px-3 py-1.5 rounded-md hover:bg-[#6bcae2] font-medium mt-2 text-sm"
        >
          Back to Strategy Testing
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

            {/* Average Performance */}
            <div className="mb-8">
              <div className="mb-4 text-lg font-semibold text-[#85e1fe]">Average Performance</div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-[#141721] rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Avg Training Equity</div>
                  <div className="text-white font-semibold">${result.avg_training_equity?.toFixed(2) || 'N/A'}</div>
                </div>
                <div className="bg-[#141721] rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Avg Validation Equity</div>
                  <div className="text-white font-semibold">${result.avg_validation_equity?.toFixed(2) || 'N/A'}</div>
                </div>
                <div className="bg-[#141721] rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Avg Training Return</div>
                  <div className="text-white font-semibold">{(result.avg_training_return * 100)?.toFixed(2) || '0.00'}%</div>
                </div>
                <div className="bg-[#141721] rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-2">Avg Validation Return</div>
                  <div className="text-white font-semibold">{(result.avg_validation_return * 100)?.toFixed(2) || '0.00'}%</div>
                </div>
              </div>
            </div>

            {/* Fold Results Table - Matching PreviousOptimisationView style */}
            {foldResults.length > 0 && (
              <div className="mb-8">
                <div className="mb-4 text-lg font-semibold text-[#85e1fe]">Fold Results</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border-separate border-spacing-y-2">
                    <thead>
                      <tr className="bg-[#000] text-white font-bold">
                        <th className="px-2 py-2 text-left">Pass</th>
                        <th className="px-2 py-2 text-left">Training Equity [$]</th>
                        <th className="px-2 py-2 text-left">Validation Equity [$]</th>
                        <th className="px-2 py-2 text-left">Training Return [%]</th>
                        <th className="px-2 py-2 text-left">Validation Return [%]</th>
                        <th className="px-2 py-2 text-left">Training Sharpe</th>
                        <th className="px-2 py-2 text-left">Validation Sharpe</th>
                        <th className="px-2 py-2 text-left">Training Max DD [%]</th>
                        <th className="px-2 py-2 text-left">Validation Max DD [%]</th>
                        <th className="px-2 py-2 text-left">Training Trades</th>
                        <th className="px-2 py-2 text-left">Validation Trades</th>
                        <th className="px-2 py-2 text-left">Parameters</th>
                        <th className="px-2 py-2 text-left"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {foldResults.map((fold: any, idx: number) => (
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
                              <span className="font-medium">{fold.fold}</span>
                            </div>
                          </td>
                          <td className="px-2 py-2">{get(fold, 'training_equity')?.toFixed(2)}</td>
                          <td className="px-2 py-2">{get(fold, 'validation_equity')?.toFixed(2)}</td>
                          <td className="px-2 py-2">{((get(fold, 'training_return') || 0) * 100).toFixed(2)}</td>
                          <td className="px-2 py-2">{((get(fold, 'validation_return') || 0) * 100).toFixed(2)}</td>
                          <td className="px-2 py-2">{get(fold, 'training_sharpe')?.toFixed(2)}</td>
                          <td className="px-2 py-2">{get(fold, 'validation_sharpe')?.toFixed(2)}</td>
                          <td className="px-2 py-2">{((get(fold, 'training_max_drawdown') || 0) * 100).toFixed(2)}</td>
                          <td className="px-2 py-2">{((get(fold, 'validation_max_drawdown') || 0) * 100).toFixed(2)}</td>
                          <td className="px-2 py-2">{get(fold, 'training_trades')}</td>
                          <td className="px-2 py-2">{get(fold, 'validation_trades')}</td>
                          <td className="px-2 py-2 max-w-[200px] truncate" title={JSON.stringify(fold.parameters)}>
                            {Object.entries(fold.parameters || {})
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
              </div>
            )}

            {/* Optimized Parameters per Fold */}
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
            {/* Split Graph */}
            {result.split_graph_html && (
              <div>
                <div className="mb-2 font-bold text-white text-base">Split Graph</div>
                <iframe
                  title="Split Graph"
                  className="w-full h-[400px] bg-white"
                  style={{ border: 'none' }}
                  srcDoc={result.split_graph_html}
                />
              </div>
            )}
            
            {/* Equity Trend Graph */}
            {result.equity_trend_html && (
              <div>
                <div className="mb-2 font-bold text-white text-base">Equity Trend</div>
                <iframe
                  title="Equity Trend"
                  className="w-full h-[400px] bg-white"
                  style={{ border: 'none' }}
                  srcDoc={result.equity_trend_html}
                />
              </div>
            )}
            
            {/* Return Trend Graph */}
            {result.return_trend_html && (
              <div>
                <div className="mb-2 font-bold text-white text-base">Return Trend</div>
                <iframe
                  title="Return Trend"
                  className="w-full h-[400px] bg-white"
                  style={{ border: 'none' }}
                  srcDoc={result.return_trend_html}
                />
              </div>
            )}
            
            {/* Variable Trends */}
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
            
            {/* Other plots from plots object */}
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
                    ['Total Folds', foldResults.length],
                    ['Total Generations', generations.length],
                    ['Avg Training Equity', `$${result.avg_training_equity?.toFixed(2) || 'N/A'}`],
                    ['Avg Validation Equity', `$${result.avg_validation_equity?.toFixed(2) || 'N/A'}`],
                    ['Avg Training Return', `${(result.avg_training_return * 100)?.toFixed(2) || '0.00'}%`],
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
                    ['Best Fold', foldResults.length > 0 ? '1' : 'N/A'],
                    ['Average Parameters', folds.length > 0 ? Object.keys(folds[0]).length : 'N/A'],
                    ['Optimization Algorithm', 'Genetic Algorithm'],
                    ['Validation Method', 'Walk Forward'],
                    ['Statistical Significance', result.p_value < 0.05 ? 'Significant' : 'Not Significant'],
                    ['Avg Validation Return', `${(result.avg_validation_return * 100)?.toFixed(2) || '0.00'}%`],
                    ['Avg Training Sharpe', result.avg_training_sharpe?.toFixed(2) || 'N/A'],
                    ['Avg Validation Sharpe', result.avg_validation_sharpe?.toFixed(2) || 'N/A'],
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
} 