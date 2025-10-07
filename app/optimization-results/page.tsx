"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { getOptimizationJob, getOptimizationResultDetail } from "../AllApiCalls"
import { ArrowLeft, RefreshCw } from "lucide-react"
import AuthGuard from "@/hooks/useAuthGuard"

function OptimizationResultsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const jobId = searchParams.get('job_id')
  const type = searchParams.get('type') // 'droplet' or null/undefined for legacy

  const [jobData, setJobData] = useState<any>(null)
  const [optimisationResult, setOptimisationResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)
  const [selectedTab, setSelectedTab] = useState<'results' | 'graph' | 'report'>('results')
  const [selectedRow, setSelectedRow] = useState<any>(null)
  const isDroplet = type === 'droplet'

  // Simple toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const toast = document.createElement('div');
    let bgColor = 'bg-[#85e1fe]';
    if (type === 'error') bgColor = 'bg-red-600';
    if (type === 'warning') bgColor = 'bg-yellow-500';
    
    toast.className = `fixed bottom-10 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded shadow-lg z-50 text-black ${bgColor}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      document.body.removeChild(toast);
    }, 3000);
  };

  // Fetch job data
  const fetchJobData = async () => {
    if (!jobId) {
      setError("No job ID provided")
      setIsLoading(false)
      return
    }

    try {
      let data;
      
      if (isDroplet) {
        // For droplet optimizations, call the jobs API
        data = await getOptimizationJob(jobId)
        console.log("📊 Droplet job data:", data)
      } else {
        // For legacy optimizations, call the results API
        data = await getOptimizationResultDetail(jobId)
        console.log("📊 Legacy optimization data:", data)
      }
      
      setJobData(data)

      const normalizedStatus = (data.status || '').toLowerCase()

      // If job is completed, process results
      if (['completed', 'success'].includes(normalizedStatus)) {
        if (data.results) {
          const transformedResult = {
            convergence_data: data.results.convergence_data || [],
            optimization_heatmap_data: data.results.optimization_heatmap_data || [],
            trade_results: data.results.trade_results || [],
            full_optimization_results: data.results.convergence_data || [],
            table: data.results.convergence_data || [],
            optimiser_file: data.results.optimiser_file,
            output_dir: data.results.output_dir,
            time_taken: data.results.time_taken,
            num_trades: data.results.num_trades,
            final_equity: data.results.final_equity,
            sharpe_ratio: data.results.sharpe_ratio,
            sortino_ratio: data.results.sortino_ratio,
            calmar_ratio: data.results.calmar_ratio,
          }
          setOptimisationResult(transformedResult)
          
          // Select first row by default
          if (transformedResult.convergence_data && transformedResult.convergence_data.length > 0) {
            setSelectedRow(transformedResult.convergence_data[0])
          }
        }
        setIsLoading(false)
      } else if (['failed', 'cancelled'].includes(normalizedStatus)) {
        setError(data.error_message || `Optimization ${data.status}`)
        setIsLoading(false)
      }
      // If still running, keep polling (only for droplet)
    } catch (err: any) {
      setError(err?.message || "Failed to fetch job data")
      setIsLoading(false)
    }
  }

  // Start polling
  useEffect(() => {
    if (!jobId) return

    fetchJobData()

    // Only poll for droplet optimizations
    if (isDroplet) {
      const interval = setInterval(async () => {
        if (!jobId) return
        
        try {
          const data = await getOptimizationJob(jobId)
          const normalizedStatus = (data.status || '').toLowerCase()
          
          if (['completed', 'failed', 'cancelled', 'success'].includes(normalizedStatus)) {
            clearInterval(interval)
            setPollingInterval(null)
            fetchJobData()
          }
        } catch (err) {
          console.error("Polling error:", err)
        }
      }, 5000)

      setPollingInterval(interval)

      return () => {
        if (interval) clearInterval(interval)
      }
    }
  }, [jobId, isDroplet])

  // Helper function to generate convergence plot HTML
  const generateConvergencePlotHTML = (convergenceData: any[]) => {
    if (!convergenceData || convergenceData.length === 0) return null;
    
    const generations = convergenceData.map((d, idx) => d.generation ?? idx);
    const equityValues = convergenceData.map(d => d['Equity Final [$]']);
    
    const plotlyData = JSON.stringify([{
      x: generations,
      y: equityValues,
      type: 'scatter',
      mode: 'lines+markers',
      marker: { color: '#85e1fe' },
      line: { color: '#85e1fe', width: 2 },
      name: 'Equity Final'
    }]);
    
    const layout = JSON.stringify({
      title: 'Convergence Plot',
      xaxis: { title: 'Generation', gridcolor: '#333' },
      yaxis: { title: 'Equity Final [$]', gridcolor: '#333' },
      paper_bgcolor: '#0e1018',
      plot_bgcolor: '#0e1018',
      font: { color: '#fff' }
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      </head>
      <body style="margin:0;">
        <div id="plot" style="width:100%;height:100%;"></div>
        <script>
          Plotly.newPlot('plot', ${plotlyData}, ${layout}, {responsive: true});
        </script>
      </body>
      </html>
    `;
  };

  // Helper function to generate heatmap plot HTML
  const generateHeatmapPlotHTML = (heatmapData: any[]) => {
    if (!heatmapData || heatmapData.length === 0) return null;
    
    const param1Key = Object.keys(heatmapData[0]).find(k => k !== 'Equity Final [$]' && k !== 'Return [%]');
    const param2Key = Object.keys(heatmapData[0]).find(k => k !== 'Equity Final [$]' && k !== 'Return [%]' && k !== param1Key);
    
    if (!param1Key || !param2Key) {
      const x = heatmapData.map((d, idx) => idx);
      const y = heatmapData.map(d => d['Equity Final [$]']);
      
      const plotlyData = JSON.stringify([{
        x: x,
        y: y,
        mode: 'markers',
        type: 'scatter',
        marker: { 
          color: y,
          colorscale: 'Viridis',
          showscale: true,
          size: 10
        },
        name: 'Equity Final'
      }]);
      
      const layout = JSON.stringify({
        title: 'Optimization Results',
        xaxis: { title: 'Index', gridcolor: '#333' },
        yaxis: { title: 'Equity Final [$]', gridcolor: '#333' },
        paper_bgcolor: '#0e1018',
        plot_bgcolor: '#0e1018',
        font: { color: '#fff' }
      });
      
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
        </head>
        <body style="margin:0;">
          <div id="plot" style="width:100%;height:100%;"></div>
          <script>
            Plotly.newPlot('plot', ${plotlyData}, ${layout}, {responsive: true});
          </script>
        </body>
        </html>
      `;
    }
    
    const x = heatmapData.map(d => d[param1Key]);
    const y = heatmapData.map(d => d[param2Key]);
    const z = heatmapData.map(d => d['Equity Final [$]']);
    
    const plotlyData = JSON.stringify([{
      x: x,
      y: y,
      mode: 'markers',
      type: 'scatter',
      marker: { 
        color: z,
        colorscale: 'Viridis',
        showscale: true,
        size: 12,
        colorbar: { title: 'Equity Final [$]' }
      },
      text: z.map((val: number) => `$${val.toFixed(2)}`),
      hovertemplate: `${param1Key}: %{x}<br>${param2Key}: %{y}<br>Equity: %{text}<extra></extra>`
    }]);
    
    const layout = JSON.stringify({
      title: 'Parameter Optimization Heatmap',
      xaxis: { title: param1Key, gridcolor: '#333' },
      yaxis: { title: param2Key, gridcolor: '#333' },
      paper_bgcolor: '#0e1018',
      plot_bgcolor: '#0e1018',
      font: { color: '#fff' }
    });
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.plot.ly/plotly-latest.min.js"></script>
      </head>
      <body style="margin:0;">
        <div id="plot" style="width:100%;height:100%;"></div>
        <script>
          Plotly.newPlot('plot', ${plotlyData}, ${layout}, {responsive: true});
        </script>
      </body>
      </html>
    `;
  };

  // Calculate progress percentage based on status
  const getProgressPercentage = () => {
    if (!jobData) return 0;
    const status = (jobData.status || '').toLowerCase();
    
    if (status === 'creating_droplet') return 10;
    if (status === 'running') return 50;
    if (['completed', 'success'].includes(status)) return 100;
    if (['failed', 'cancelled'].includes(status)) return 100;
    
    return 0;
  };

  const getStatusColor = () => {
    if (!jobData) return 'bg-gray-500';
    const status = (jobData.status || '').toLowerCase();
    
    if (['completed', 'success'].includes(status)) return 'bg-green-500';
    if (status === 'running') return 'bg-blue-500';
    if (status === 'failed') return 'bg-red-500';
    if (status === 'cancelled') return 'bg-yellow-500';
    
    return 'bg-gray-500';
  };

  return (
    <div className="flex min-h-screen bg-[#121420] text-white">
      <div className="hidden md:block">
        <Sidebar currentPage="home" />
      </div>
      <MobileSidebar currentPage="home" />

      <main className="flex-1 p-6 ml-0 md:ml-[63px]">
          {/* Header with Back Button */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-[#85e1fe] hover:text-[#6bcae2] mb-4"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Strategy Testing</span>
            </button>
            <h1 className="text-3xl font-bold text-white">Optimization Results</h1>
          </div>

          {/* Job Status Card */}
          {jobData && (
            <div className="mb-6 p-6 bg-[#141721] rounded-lg border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">{jobData.strategy_name || jobData.strategy_statement_name}</h2>
                  <p className="text-gray-400">Job ID: {jobData.id}</p>
                  <p className="text-gray-400">Type: {isDroplet ? jobData.type : 'Legacy Optimization'}</p>
                  <p className="text-gray-400">
                    Method: {isDroplet ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-[#85e1fe] text-black ml-2">
                        Droplet
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-600 text-white ml-2">
                        Legacy
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    jobData.status?.toLowerCase() === 'completed' || jobData.status?.toLowerCase() === 'success' ? 'bg-green-500 text-white' :
                    jobData.status?.toLowerCase() === 'running' ? 'bg-blue-500 text-white' :
                    jobData.status?.toLowerCase() === 'failed' ? 'bg-red-500 text-white' :
                    jobData.status?.toLowerCase() === 'cancelled' ? 'bg-yellow-500 text-black' :
                    'bg-gray-500 text-white'
                  }`}>
                    {jobData.status}
                  </span>
                  {isLoading && (
                    <RefreshCw className="w-5 h-5 animate-spin text-[#85e1fe]" />
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Progress</span>
                  <span className="text-sm text-gray-400">{getProgressPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getStatusColor()}`}
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Estimated Cost</p>
                  <p className="text-white font-semibold">${jobData.estimated_cost || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Actual Cost</p>
                  <p className="text-white font-semibold">${jobData.actual_cost || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Runtime</p>
                  <p className="text-white font-semibold">{jobData.runtime_minutes ? `${jobData.runtime_minutes} min` : '-'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Started At</p>
                  <p className="text-white font-semibold">
                    {jobData.started_at ? new Date(jobData.started_at).toLocaleTimeString() : '-'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && !optimisationResult && (
            <div className="flex flex-col items-center justify-center py-20">
              <RefreshCw className="w-16 h-16 animate-spin text-[#85e1fe] mb-4" />
              <p className="text-xl text-gray-400">Optimization in progress...</p>
              <p className="text-sm text-gray-500 mt-2">You can navigate away and come back later</p>
            </div>
          )}

          {/* Results Display */}
          {optimisationResult && (
            <div className="bg-[#000000] rounded-lg p-6">
              {/* Results Summary */}
              <div className="mb-6 p-4 bg-[#141721] rounded-md border border-gray-700">
                <h3 className="text-lg font-semibold text-white mb-3">Optimization Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-gray-400 text-sm">Final Equity</p>
                    <p className="text-white font-semibold text-lg">
                      ${optimisationResult.final_equity?.toFixed(2) || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Trades</p>
                    <p className="text-white font-semibold text-lg">{optimisationResult.num_trades || '-'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Sharpe Ratio</p>
                    <p className="text-white font-semibold text-lg">
                      {optimisationResult.sharpe_ratio?.toFixed(2) || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Time Taken</p>
                    <p className="text-white font-semibold text-lg">{optimisationResult.time_taken || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-gray-700 mb-6">
                <button
                  className={`px-6 py-3 font-semibold ${selectedTab === 'results' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
                  onClick={() => setSelectedTab('results')}
                >
                  Results
                </button>
                <button
                  className={`px-6 py-3 font-semibold ${selectedTab === 'graph' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
                  onClick={() => setSelectedTab('graph')}
                >
                  Graph
                </button>
                <button
                  className={`px-6 py-3 font-semibold ${selectedTab === 'report' ? 'text-[#85e1fe] border-b-2 border-[#85e1fe]' : 'text-gray-400'}`}
                  onClick={() => setSelectedTab('report')}
                >
                  Report
                </button>
              </div>

              {/* Results Tab */}
              {selectedTab === 'results' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs border-separate border-spacing-y-2">
                    <thead>
                      <tr className="bg-[#1A1D2D] text-white">
                        <th className="px-2 py-2">#</th>
                        <th className="px-2 py-2">Return [%]</th>
                        <th className="px-2 py-2">Equity Final [$]</th>
                        <th className="px-2 py-2"># Trades</th>
                        <th className="px-2 py-2">Win Rate [%]</th>
                        <th className="px-2 py-2">Profit Factor</th>
                        <th className="px-2 py-2">Max. Drawdown [%]</th>
                        <th className="px-2 py-2">Sharpe Ratio</th>
                        <th className="px-2 py-2">Parameters</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(optimisationResult.convergence_data || []).map((row: any, idx: number) => {
                        const standardFields = ['Return [%]', 'Equity Final [$]', '# Trades', 'Win Rate [%]', 
                          'Profit Factor', 'Max. Drawdown [%]', 'Sharpe Ratio', 'Sortino Ratio', 'Calmar Ratio',
                          'Return (Ann.) [%]', 'Volatility (Ann.) [%]', 'Start', 'End', 'Duration', 'SQN',
                          'Exposure Time [%]', 'Equity Peak [$]', 'Avg. Trade [%]', 'Best Trade [%]', 
                          'Worst Trade [%]', 'Avg. Drawdown [%]', 'Avg. Drawdown Duration', 'Max. Drawdown Duration',
                          'Avg. Trade Duration', 'Max. Trade Duration', 'Buy & Hold Return [%]', 'Expectancy [%]',
                          'Unnamed: 0', 'generation'];
                        
                        const parameters = Object.keys(row)
                          .filter(key => !standardFields.includes(key))
                          .map(key => `${key}=${row[key]}`)
                          .join(', ');
                        
                        return (
                          <tr
                            key={idx}
                            className={`bg-[#141721] text-white cursor-pointer hover:bg-[#1e2132] ${selectedRow === row ? 'bg-[#23263a]' : ''}`}
                            onClick={() => {
                              setSelectedRow(row);
                              setSelectedTab('report');
                            }}
                          >
                            <td className="px-2 py-2">{idx + 1}</td>
                            <td className="px-2 py-2">{row['Return [%]']?.toFixed(2) || '-'}</td>
                            <td className="px-2 py-2">{row['Equity Final [$]']?.toFixed(2) || '-'}</td>
                            <td className="px-2 py-2">{row['# Trades'] || '-'}</td>
                            <td className="px-2 py-2">{row['Win Rate [%]']?.toFixed(2) || '-'}</td>
                            <td className="px-2 py-2">{row['Profit Factor']?.toFixed(2) || '-'}</td>
                            <td className="px-2 py-2">{row['Max. Drawdown [%]']?.toFixed(2) || '-'}</td>
                            <td className="px-2 py-2">{row['Sharpe Ratio']?.toFixed(2) || '-'}</td>
                            <td className="px-2 py-2 max-w-[200px] truncate" title={parameters}>{parameters || '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Graph Tab */}
              {selectedTab === 'graph' && (
                <div>
                  {optimisationResult.convergence_data && optimisationResult.convergence_data.length > 0 && (() => {
                    const plotHTML = generateConvergencePlotHTML(optimisationResult.convergence_data);
                    return plotHTML ? (
                      <div className="mb-8">
                        <h3 className="mb-2 text-lg font-semibold text-white">Convergence Plot</h3>
                        <iframe
                          title="Convergence Plot"
                          style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#0e1018" }}
                          srcDoc={plotHTML}
                        />
                      </div>
                    ) : null;
                  })()}
                  
                  {optimisationResult.optimization_heatmap_data && optimisationResult.optimization_heatmap_data.length > 0 && (() => {
                    const plotHTML = generateHeatmapPlotHTML(optimisationResult.optimization_heatmap_data);
                    return plotHTML ? (
                      <div className="mb-8">
                        <h3 className="mb-2 text-lg font-semibold text-white">Parameter Optimization Heatmap</h3>
                        <iframe
                          title="Optimization Heatmap"
                          style={{ width: "100%", height: "400px", border: "none", backgroundColor: "#0e1018" }}
                          srcDoc={plotHTML}
                        />
                      </div>
                    ) : null;
                  })()}
                </div>
              )}

              {/* Report Tab */}
              {selectedTab === 'report' && selectedRow && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    {Object.entries(selectedRow).map(([key, value]) => (
                      typeof value === 'number' || typeof value === 'string' ? (
                        <div key={key} className="flex justify-between border-b border-gray-800 py-1 text-sm">
                          <span className="text-gray-400">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                          <span className="text-white font-semibold">{value}</span>
                        </div>
                      ) : null
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
      </main>
    </div>
  )
}

export default function OptimizationResultsPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="flex min-h-screen bg-[#121420] text-white items-center justify-center">
          <div className="flex flex-col items-center">
            <RefreshCw className="w-16 h-16 animate-spin text-[#85e1fe] mb-4" />
            <p className="text-xl text-gray-400">Loading optimization results...</p>
          </div>
        </div>
      }>
        <OptimizationResultsContent />
      </Suspense>
    </AuthGuard>
  )
}

