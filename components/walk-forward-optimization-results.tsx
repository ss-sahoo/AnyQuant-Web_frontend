"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X } from "lucide-react"

interface WalkForwardOptimizationResult {
  id: number
  strategy_statement: number
  strategy_statement_name: string
  account_username: string
  algorithm: string
  optimization_date: string
  execution_time_seconds: number
  warmup_bars: number
  lookback_bars: number
  validation_bars: number
  anchor: boolean
  avg_training_equity: number
  avg_validation_equity: number
  avg_training_return: number
  avg_validation_return: number
  z_statistic: number
  p_value: number
  hypothesis_decision: string
  status: string
  trades_plot_html?: string
  heatmap_plot_html?: string
}

interface WalkForwardOptimizationResultsProps {
  results: WalkForwardOptimizationResult[]
  onClose: () => void
  onViewDetail: (result: WalkForwardOptimizationResult) => void
  onDelete: (id: number) => void
  onLoadResult: (result: WalkForwardOptimizationResult) => void
}

export function WalkForwardOptimizationResults({
  results,
  onClose,
  onViewDetail,
  onDelete,
  onLoadResult,
}: WalkForwardOptimizationResultsProps) {
  const [activeTab, setActiveTab] = useState<'results' | 'graph' | 'report'>('results')
  const [selectedResult, setSelectedResult] = useState<WalkForwardOptimizationResult | null>(null)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-white">Walk Forward Optimization Results</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {results.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No walk forward optimization results found
            </div>
          ) : (
            <>
              {/* Top-level tabs: Results | Graph | Report */}
              

              {/* Results Tab */}
              {activeTab === 'results' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border-separate border-spacing-y-2">
                    <thead>
                      <tr className="bg-[#1A1D2D] text-white">
                        <th className="px-2 py-2">#</th>
                        <th className="px-2 py-2">Strategy</th>
                        <th className="px-2 py-2">Algorithm</th>
                        <th className="px-2 py-2">Date</th>
                        <th className="px-2 py-2">Status</th>
                        <th className="px-2 py-2">Avg Training Return</th>
                        <th className="px-2 py-2">Avg Validation Return</th>
                        <th className="px-2 py-2">Z-Statistic</th>
                        <th className="px-2 py-2">P-Value</th>
                        <th className="px-2 py-2">Decision</th>
                        <th className="px-2 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, idx) => (
                        <tr
                          key={result.id}
                          className={`bg-[#141721] text-white cursor-pointer ${selectedResult === result ? 'bg-[#23263a]' : ''}`}
                          onClick={() => {
                            setSelectedResult(result);
                            setActiveTab('report');
                          }}
                        >
                          <td className="px-2 py-2">{idx + 1}</td>
                          <td className="px-2 py-2 max-w-[150px] truncate" title={result.strategy_statement_name}>
                            {result.strategy_statement_name}
                          </td>
                          <td className="px-2 py-2">{result.algorithm}</td>
                          <td className="px-2 py-2">{new Date(result.optimization_date).toLocaleDateString()}</td>
                          <td className="px-2 py-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              result.status === "completed" ? "bg-green-500 text-white" :
                              result.status === "running" ? "bg-yellow-500 text-black" :
                              result.status === "failed" ? "bg-red-500 text-white" :
                              "bg-gray-500 text-white"
                            }`}>
                              {result.status}
                            </span>
                          </td>
                          <td className="px-2 py-2">{result.avg_training_return?.toFixed(2) || "N/A"}%</td>
                          <td className="px-2 py-2">{result.avg_validation_return?.toFixed(2) || "N/A"}%</td>
                          <td className="px-2 py-2">{result.z_statistic?.toFixed(3) || "N/A"}</td>
                          <td className="px-2 py-2">{result.p_value?.toFixed(4) || "N/A"}</td>
                          <td className="px-2 py-2">
                          
                          </td>
                          <td className="px-2 py-2 text-right">
                            <div className="flex gap-2">
                              <button
                                className="text-[#85e1fe] hover:underline text-xs"
                                onClick={e => { e.stopPropagation(); onViewDetail(result); }}
                              >
                                View
                              </button>
                              <button
                                className="text-red-400 hover:text-red-300 text-xs"
                                onClick={e => { e.stopPropagation(); onDelete(result.id); }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Graph Tab */}
              {activeTab === 'graph' && selectedResult && (
                <div>
                  {selectedResult.heatmap_plot_html && (
                    <div className="mb-8">
                      <h3 className="mb-2 text-lg font-semibold text-white">Heatmap Plot</h3>
                      <iframe
                        title="Heatmap Plot"
                        style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#f8f8f8" }}
                        srcDoc={selectedResult.heatmap_plot_html}
                      />
                    </div>
                  )}
                  {selectedResult.trades_plot_html && (
                    <div className="mb-8">
                      <h3 className="mb-2 text-lg font-semibold text-white">Trades Plot</h3>
                      <iframe
                        title="Trades Plot"
                        style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#f8f8f8" }}
                        srcDoc={selectedResult.trades_plot_html}
                      />
                    </div>
                  )}
                  {!selectedResult.heatmap_plot_html && !selectedResult.trades_plot_html && (
                    <div className="text-center text-gray-400 py-8">
                      No graphs available for this result
                    </div>
                  )}
                </div>
              )}

              {/* Report Tab */}
              {activeTab === 'report' && selectedResult && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Walk Forward Configuration</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Warmup Bars</span>
                        <span className="text-white font-semibold">{selectedResult.warmup_bars}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Lookback Bars</span>
                        <span className="text-white font-semibold">{selectedResult.lookback_bars}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Validation Bars</span>
                        <span className="text-white font-semibold">{selectedResult.validation_bars}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Anchor</span>
                        <span className="text-white font-semibold">{selectedResult.anchor ? "ON" : "OFF"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Execution Time</span>
                        <span className="text-white font-semibold">{selectedResult.execution_time_seconds?.toFixed(2) || "N/A"}s</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Performance Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg Training Equity</span>
                        <span className="text-white font-semibold">${selectedResult.avg_training_equity?.toFixed(2) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg Validation Equity</span>
                        <span className="text-white font-semibold">${selectedResult.avg_validation_equity?.toFixed(2) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg Training Return</span>
                        <span className="text-white font-semibold">{selectedResult.avg_training_return?.toFixed(2) || "N/A"}%</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Avg Validation Return</span>
                        <span className="text-white font-semibold">{selectedResult.avg_validation_return?.toFixed(2) || "N/A"}%</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Z-Statistic</span>
                        <span className="text-white font-semibold">{selectedResult.z_statistic?.toFixed(3) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">P-Value</span>
                        <span className="text-white font-semibold">{selectedResult.p_value?.toFixed(4) || "N/A"}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-800 py-2">
                        <span className="text-gray-400">Hypothesis Decision</span>
                        <span className={`font-semibold ${
                          selectedResult.hypothesis_decision === "REJECT" ? "text-red-400" :
                          selectedResult.hypothesis_decision === "ACCEPT" ? "text-green-400" :
                          "text-gray-400"
                        }`}>
                          {selectedResult.hypothesis_decision || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {results.length > 0 && (
          <div className="p-6 border-t border-gray-700 flex justify-end">
            <button
              onClick={() => selectedResult && onLoadResult(selectedResult)}
              className="bg-[#85e1fe] text-black px-6 py-2 rounded-md hover:bg-[#6bcae2]"
              disabled={!selectedResult}
            >
              Load Selected Result
            </button>
          </div>
        )}
      </div>
    </div>
  )
} 