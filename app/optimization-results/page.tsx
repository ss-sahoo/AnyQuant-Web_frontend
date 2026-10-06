"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import {
  getOptimizationJob,
  getOptimizationResultDetail,
  getWalkForwardOptimizationResultDetail,
  listOptimizationFiles,
  downloadOptimizationFile,
  downloadOptimizationZip,
} from "../AllApiCalls"
import { Fetch } from "../usefetch"
import { ArrowLeft, RefreshCw } from "lucide-react"
import AuthGuard from "@/hooks/useAuthGuard"
import { OptimisationProgressPanel } from "@/components/optimisation-progress-panel"

const ACTIVE_STATUSES = ['pending', 'creating', 'creating_droplet', 'running']
const FINISHED_STATUSES = ['completed', 'failed', 'cancelled', 'success']

// Billing details come from the job record, not job-status: a poll keeps
// the ones an earlier fetch filled in rather than blanking them.
const JOB_DETAIL_FIELDS = ['estimated_cost', 'actual_cost', 'runtime_minutes', 'droplet_size',
  'droplet_id', 'started_at', 'completed_at']

const keepJobDetails = (previous: any, next: any) => {
  if (!previous) return next
  const merged = { ...next }
  for (const field of JOB_DETAIL_FIELDS) {
    if (merged[field] == null && previous[field] != null) merged[field] = previous[field]
  }
  return merged
}

// Percent with enough decimals for the near-zero fold returns a small
// contract size produces (-0.0005%), which toFixed(2) shows as -0.00.
const formatPercent = (value: any) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-'
  return `${value.toFixed(Math.abs(value) < 0.1 && value !== 0 ? 4 : 2)}%`
}

const decisionColour = (decision: string | null | undefined) => {
  const text = (decision || '').toLowerCase()
  if (text.includes('unprofitable')) return 'text-red-400'
  if (text.includes('significantly profitable')) return 'text-green-400'
  return 'text-yellow-400'
}

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
  const [downloadableFiles, setDownloadableFiles] = useState<any[]>([])
  const [filesError, setFilesError] = useState<string | null>(null)
  const [pendingDownload, setPendingDownload] = useState<string | null>(null)
  const [walkForwardDetail, setWalkForwardDetail] = useState<any>(null)
  const isDroplet = type === 'droplet'
  // job-status says `optimization_type`; the job record spells the type out.
  const isWalkForward =
    jobData?.optimization_type === 'walk_forward' || jobData?.type === 'Walk Forward Optimization'

  /**
   * The download routes key off the numeric optimization-job id. For
   * type=droplet the URL carries a run_id string instead, which the legacy
   * int-only ZIP route rejected outright — hence "Download All Files" failing
   * every time on droplet runs. Prefer a numeric id from the payload and fall
   * back to whatever the URL gave us for the run_id-tolerant route.
   */
  const numericJobId = (() => {
    const candidate = [jobData?.job_id, jobData?.optimization_job_id, jobData?.id, jobId].find(
      (value) => value != null && /^\d+$/.test(String(value)),
    )
    return candidate ?? null
  })()
  const fileJobRef = numericJobId ?? jobId

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

  /**
   * Billing and droplet details live on the optimization-jobs record, not on
   * job-status. The droplet branch below used to read GET /api/optimization-jobs/
   * (which carries them) and was switched to GET /api/job-status/ so that a
   * run_id from a fresh submit would resolve — job-status reports progress and
   * results but no pricing, so the cost row went blank with it.
   *
   * Best-effort re-read of the job record to fill in only what job-status left
   * out. A run_id URL with no numeric job id anywhere in the payload simply
   * falls through and the cost row keeps its placeholder, as it does today.
   */
  const fillDropletJobDetails = async (data: any) => {
    if (!data || data.estimated_cost != null || data.actual_cost != null) return data

    const numericJobId = [data.job_id, data.optimization_job_id, data.id, jobId].find(
      (value) => value != null && /^\d+$/.test(String(value)),
    )
    if (numericJobId == null) return data

    try {
      const job = await getOptimizationJob(numericJobId)
      const merged = { ...data }
      for (const field of ['estimated_cost', 'actual_cost', 'runtime_minutes', 'droplet_size', 'droplet_id', 'started_at', 'completed_at']) {
        if (merged[field] == null && job?.[field] != null) merged[field] = job[field]
      }
      return merged
    } catch (err) {
      console.warn("Could not load cost details for optimization job", numericJobId, err)
      return data
    }
  }

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
        // For droplet optimizations, use the job-status endpoint with run_id
        const response = await Fetch(`/api/job-status/${jobId}/`, {
          method: "GET"
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch job status: ${response.status}`)
        }
        
        data = await fillDropletJobDetails(await response.json())
        console.log("📊 Droplet job data from job-status:", data)
      } else {
        // For legacy optimizations, call the results API
        data = await getOptimizationResultDetail(jobId)
        console.log("📊 Legacy optimization data:", data)
      }
      
      setJobData(data)

      const normalizedStatus = (data.status || '').toLowerCase()

      // If job is completed, process results
      if (['completed', 'success'].includes(normalizedStatus)) {
        if (isDroplet && data.optimization_type === 'walk_forward') {
          // Folds, per-fold parameters and plots come from the walk-forward
          // view, which reads the job by its numeric id.
          const walkForwardId = [data.job_id, data.id, jobId].find(
            (value) => value != null && /^\d+$/.test(String(value)),
          )
          if (walkForwardId != null) {
            try {
              setWalkForwardDetail(await getWalkForwardOptimizationResultDetail(walkForwardId, { throughDroplet: true }))
            } catch (err) {
              console.warn("Could not load walk forward results for job", walkForwardId, err)
            }
          }
        } else if (data.results) {
          // ✅ Use full optimization results instead of preview (which is limited to 20 rows)
          const tableData = data.results.optimisation_results || data.results.full_optimization_results || data.results.optimisation_preview || data.results.convergence_data || []
          
          console.log(`📊 Loaded ${tableData.length} optimization results`)
          
          const transformedResult = {
            convergence_data: tableData,
            optimization_heatmap_data: data.results.optimization_heatmap_data || [],
            trade_results: data.results.trade_results || [],
            full_optimization_results: tableData,
            table: tableData,
            optimiser_file: data.results.optimiser_file,
            output_dir: data.results.output_dir,
            time_taken: data.results.optimised_parameters?.['Time taken'] || data.results.time_taken,
            num_trades: data.results.num_trades,
            final_equity: data.results.final_equity,
            sharpe_ratio: data.results.sharpe_ratio,
            sortino_ratio: data.results.sortino_ratio,
            calmar_ratio: data.results.calmar_ratio,
            optimised_parameters: data.results.optimised_parameters,
            optimised_parameter_txt: data.results.optimised_parameter_txt,
            results_output_listing: data.results.results_output_listing,
            plots_html: data.results.plots_html,
          }
          setOptimisationResult(transformedResult)
          
          // Select first row by default
          if (tableData && tableData.length > 0) {
            setSelectedRow(tableData[0])
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
          // Use job-status endpoint for droplet jobs
          const response = await Fetch(`/api/job-status/${jobId}/`, {
            method: "GET"
          })
          
          if (!response.ok) {
            console.error("Polling error:", response.status)
            return
          }
          
          const data = await response.json()
          const normalizedStatus = (data.status || '').toLowerCase()

          // Every poll lands on screen: status and progress move while the
          // droplet works, and used to show only after a page refresh.
          setJobData((previous: any) => keepJobDetails(previous, data))

          if (FINISHED_STATUSES.includes(normalizedStatus)) {
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

  /**
   * Source the Generated Files list from the API rather than from the raw
   * results_output_listing on the payload. That listing is an os.listdir() of
   * the droplet's output dir, so most of its rows had Download buttons for
   * files the download route cannot serve.
   */
  useEffect(() => {
    if (!fileJobRef) return
    const status = (jobData?.status || '').toLowerCase()
    if (!['completed', 'success'].includes(status)) return

    let isCancelled = false
    listOptimizationFiles(fileJobRef)
      .then((files) => {
        if (isCancelled) return
        setDownloadableFiles(files)
        setFilesError(null)
      })
      .catch((err) => {
        if (isCancelled) return
        console.warn("Could not list optimisation files:", err)
        setDownloadableFiles([])
        setFilesError(err?.message || "Could not list downloadable files")
      })

    return () => {
      isCancelled = true
    }
  }, [fileJobRef, jobData?.status])

  const handleFileDownload = async (path: string) => {
    setPendingDownload(path)
    try {
      await downloadOptimizationFile(fileJobRef, path)
    } catch (err: any) {
      console.error('Download failed:', err)
      showToast(err?.message || 'Failed to download file', 'error')
    } finally {
      setPendingDownload(null)
    }
  }

  /**
   * Shared "Generated Files" renderer. Only lists what the API says it can
   * serve; when the listing endpoint is unreachable it falls back to naming
   * the files the run reported, without offering a button that would 404.
   */
  const renderGeneratedFiles = (fallbackListing?: string[], outputDir?: string) => {
    const hasServableFiles = downloadableFiles.length > 0
    const fallbackNames = !hasServableFiles && Array.isArray(fallbackListing) ? fallbackListing : []
    if (!hasServableFiles && fallbackNames.length === 0) return null

    return (
      <div className="mt-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Generated Files</h3>
        <div className="bg-[#141721] rounded-lg p-4">
          {hasServableFiles ? (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {downloadableFiles.map((file: any, idx: number) => (
                <li key={file.path || idx} className="bg-[#0e1018] rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[#85e1fe] text-lg">📄</span>
                    <span className="text-gray-300 text-sm truncate" title={file.name}>
                      {file.name}
                    </span>
                    {file.size != null && (
                      <span className="text-gray-500 text-xs whitespace-nowrap">
                        {(file.size / 1024).toFixed(0)} KB
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFileDownload(file.path)}
                    disabled={pendingDownload === file.path}
                    className="ml-2 px-3 py-1 bg-[#85e1fe] text-black rounded text-xs font-semibold hover:bg-[#6bcae2] transition-colors whitespace-nowrap disabled:opacity-50"
                  >
                    {pendingDownload === file.path ? 'Downloading…' : 'Download'}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="text-yellow-500 text-xs mb-3">
                {filesError || 'Downloadable file listing unavailable'} — showing the files this run reported.
              </p>
              <ul className="space-y-2">
                {fallbackNames.map((file: string, idx: number) => (
                  <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                    <span className="text-[#85e1fe]">📄</span>
                    {file}
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="text-gray-400 text-xs mt-3">
            Output directory: {outputDir || 'N/A'}
          </p>
        </div>
      </div>
    )
  }

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
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-2 text-[#85e1fe] hover:text-[#6bcae2]"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Strategy Testing</span>
              </button>
              
              {/* Download All Files Button */}
              {jobData && ['completed', 'success'].includes((jobData.status || '').toLowerCase()) && (
                <button
                  onClick={async () => {
                    try {
                      await downloadOptimizationZip(fileJobRef);
                      showToast('Download started!', 'success');
                    } catch (error: any) {
                      console.error('Download failed:', error);
                      showToast(error?.message || 'Failed to download files', 'error');
                    }
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#85e1fe] text-black rounded-lg font-semibold hover:bg-[#6bcae2] transition-colors"
                >
                  <span>📥</span>
                  <span>Download All Files (ZIP)</span>
                </button>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white">Optimization Results</h1>
          </div>

          {/* Job Status Card */}
          {jobData && (
            <div className="mb-6 p-6 bg-[#141721] rounded-lg border border-gray-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-white mb-2">{jobData.strategy_name || jobData.strategy_statement_name}</h2>
                  <p className="text-gray-400">Job ID: {jobData.job_id ?? jobData.id}</p>
                  <p className="text-gray-400">
                    Type: {isDroplet ? (isWalkForward ? 'Walk Forward Optimization' : 'Optimization') : 'Legacy Optimization'}
                  </p>
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
                    {String(jobData.status || '').replace(/_/g, ' ')}
                  </span>
                  {isLoading && (
                    <RefreshCw className="w-5 h-5 animate-spin text-[#85e1fe]" />
                  )}
                </div>
              </div>

              {/* Live progress while the droplet works; the bar below once it is done */}
              {isDroplet && ACTIVE_STATUSES.includes((jobData.status || '').toLowerCase()) ? (
                <OptimisationProgressPanel
                  progress={jobData.progress}
                  stale={Boolean(jobData.stale)}
                  percent={typeof jobData.progress?.percent === 'number' ? jobData.progress.percent : getProgressPercentage()}
                  label={(jobData.status || '').toLowerCase() === 'creating_droplet'
                    ? 'Creating droplet'
                    : isWalkForward ? 'Walk forward in progress' : 'Optimisation in progress'}
                />
              ) : (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-400">Progress</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{getProgressPercentage()}%</span>
                    {jobData.status?.toLowerCase() === 'running' && jobData.started_at && (
                      <span className="text-xs text-gray-500">
                        • Running for {(() => {
                          const startTime = new Date(jobData.started_at).getTime();
                          const now = Date.now();
                          const minutes = Math.floor((now - startTime) / 60000);
                          return minutes > 0 ? `${minutes} min` : 'less than 1 min';
                        })()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${getStatusColor()}`}
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              </div>
              )}

              {/* Job Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">Estimated Cost</p>
                  <p className="text-white font-semibold">
                    {jobData.estimated_cost ? `$${jobData.estimated_cost}` : 
                     jobData.status?.toLowerCase() === 'running' ? '$0.10 - $0.50' : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Actual Cost</p>
                  <p className="text-white font-semibold">
                    {jobData.actual_cost ? `$${jobData.actual_cost}` : 
                     ['completed', 'success'].includes(jobData.status?.toLowerCase()) ? 'Calculating...' : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Runtime</p>
                  <p className="text-white font-semibold">
                    {jobData.runtime_minutes ? `${jobData.runtime_minutes} min` : 
                     jobData.started_at ? (() => {
                       const startTime = new Date(jobData.started_at).getTime();
                       const now = Date.now();
                       const minutes = Math.floor((now - startTime) / 60000);
                       const seconds = Math.floor(((now - startTime) % 60000) / 1000);
                       return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
                     })() : '-'}
                  </p>
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

          {/* Walk Forward Optimization Results */}
          {jobData && isWalkForward && ['completed', 'success'].includes((jobData.status || '').toLowerCase()) && (() => {
            const wf = walkForwardDetail || jobData.results || {}
            const folds: any[] = Array.isArray(wf.fold_results) ? wf.fold_results : []
            const plots = [
              ['Train / Validation Split', wf.split_graph_html],
              ['Equity Final [$] by Fold', wf.equity_trend_html],
              ['Return (Ann.) [%] by Fold', wf.return_trend_html],
            ].filter(([, html]) => typeof html === 'string' && html.length > 0)
            const resultsId = jobData.job_id ?? jobData.id
            return (
            <div className="bg-[#000000] rounded-lg p-6">
              {/* Hypothesis Testing Results */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Hypothesis Testing (out-of-sample)</h3>
                  {resultsId != null && (
                    <button
                      type="button"
                      onClick={() => router.push(`/walk-forward-results?id=${resultsId}&source=droplet`)}
                      className="px-4 py-2 bg-[#85e1fe] text-black rounded-lg text-sm font-semibold hover:bg-[#6bcae2] transition-colors"
                    >
                      Open full walk-forward results
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#141721] rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Z-Statistic</p>
                    <p className="text-white font-semibold text-lg">
                      {typeof wf.z_statistic === 'number' ? wf.z_statistic.toFixed(4) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-[#141721] rounded-lg p-4">
                    <p className="text-gray-400 text-sm">P-Value</p>
                    <p className="text-white font-semibold text-lg">
                      {typeof wf.p_value === 'number' ? wf.p_value.toFixed(4) : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-[#141721] rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Avg Validation Return</p>
                    <p className={`font-semibold text-lg ${
                      (wf.avg_validation_return || 0) > 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatPercent(wf.avg_validation_return)}
                    </p>
                  </div>
                  <div className="bg-[#141721] rounded-lg p-4">
                    <p className="text-gray-400 text-sm">Decision</p>
                    {/* The verdict reads the sign: significant can mean reliably losing. */}
                    <p className={`font-semibold text-sm ${decisionColour(wf.hypothesis_decision)}`}>
                      {wf.hypothesis_decision || 'No decision available'}
                    </p>
                  </div>
                </div>
                {wf.error_message && (
                  <p className="mt-3 text-sm text-red-400">{wf.error_message}</p>
                )}
              </div>

              {/* Per-fold results */}
              {folds.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Folds ({folds.length})</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs border-separate border-spacing-y-1">
                      <thead>
                        <tr className="text-gray-400 text-left">
                          <th className="px-2 py-2">Fold</th>
                          <th className="px-2 py-2">Out-of-sample window</th>
                          <th className="px-2 py-2">Training Return</th>
                          <th className="px-2 py-2">OOS Return</th>
                          <th className="px-2 py-2">OOS Max DD</th>
                          <th className="px-2 py-2">OOS Trades</th>
                          <th className="px-2 py-2">OOS Equity</th>
                          <th className="px-2 py-2">Parameters</th>
                        </tr>
                      </thead>
                      <tbody>
                        {folds.map((fold: any) => (
                          <tr key={fold.fold} className="bg-[#141721] text-white">
                            <td className="px-2 py-2">{fold.fold}</td>
                            <td className="px-2 py-2 whitespace-nowrap">
                              {fold.validation_start ?? '-'} → {fold.validation_end ?? '-'}
                            </td>
                            <td className="px-2 py-2">{formatPercent(fold.training_return)}</td>
                            <td className={`px-2 py-2 ${(fold.validation_return || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {formatPercent(fold.validation_return)}
                            </td>
                            <td className="px-2 py-2">{formatPercent(fold.validation_max_drawdown)}</td>
                            <td className="px-2 py-2">{fold.validation_trades ?? '-'}</td>
                            <td className="px-2 py-2">
                              {typeof fold.validation_equity === 'number' ? `$${fold.validation_equity.toFixed(2)}` : '-'}
                            </td>
                            <td className="px-2 py-2 font-mono">
                              {Object.entries(fold.parameters || {}).map(([k, v]) => `${k}=${v}`).join(', ') || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Plots */}
              {plots.map(([title, html]) => (
                <div key={title as string} className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
                  <iframe
                    title={title as string}
                    srcDoc={html as string}
                    className="w-full h-[450px] bg-white rounded-lg"
                    style={{ border: 'none' }}
                  />
                </div>
              ))}

              {/* Walk Forward Settings */}
              {wf.lookback_bars != null && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Walk Forward Settings</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      ['Warmup Bars', wf.warmup_bars],
                      ['Lookback Bars', wf.lookback_bars],
                      ['Validation Bars', wf.validation_bars],
                      ['Anchor', wf.anchor ? 'Yes' : 'No'],
                    ].map(([label, value]) => (
                      <div key={label as string} className="bg-[#141721] rounded-lg p-4">
                        <p className="text-gray-400 text-sm">{label}</p>
                        <p className="text-white font-semibold">{value ?? '-'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Output Files Listing */}
              {renderGeneratedFiles(jobData.results?.results_output_listing, jobData.results?.output_dir)}
            </div>
            )
          })()}

          {/* Regular Optimization Results */}
          {optimisationResult && !isWalkForward && (
            <div className="bg-[#000000] rounded-lg p-6">
              {/* Optimized Parameters */}
              {optimisationResult.optimised_parameters && (
                <div className="mb-6 p-4 bg-[#141721] rounded-md border border-gray-700">
                  <h3 className="text-lg font-semibold text-white mb-3">Optimized Parameters</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0e1018] rounded-lg p-3">
                      <p className="text-gray-400 text-sm">Final Equity</p>
                      <p className="text-white font-semibold text-lg">
                        ${optimisationResult.optimised_parameters['Final optimised Equity'] || optimisationResult.final_equity?.toFixed(2) || '-'}
                      </p>
                    </div>
                    <div className="bg-[#0e1018] rounded-lg p-3">
                      <p className="text-gray-400 text-sm">Time Taken</p>
                      <p className="text-white font-semibold text-lg">
                        {optimisationResult.optimised_parameters['Time taken'] || optimisationResult.time_taken || '-'}
                      </p>
                    </div>
                    <div className="bg-[#0e1018] rounded-lg p-3">
                      <p className="text-gray-400 text-sm">Total Trades</p>
                      <p className="text-white font-semibold text-lg">{optimisationResult.num_trades || '-'}</p>
                    </div>
                    <div className="bg-[#0e1018] rounded-lg p-3">
                      <p className="text-gray-400 text-sm">Sharpe Ratio</p>
                      <p className="text-white font-semibold text-lg">
                        {optimisationResult.sharpe_ratio?.toFixed(2) || '-'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Parameter Details */}
                  {optimisationResult.optimised_parameter_txt && (
                    <div className="mt-4 bg-[#0e1018] rounded-lg p-4">
                      <p className="text-gray-400 text-sm mb-2">Parameter Details:</p>
                      <pre className="text-white text-sm whitespace-pre-wrap">
                        {optimisationResult.optimised_parameter_txt}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Results Summary (if no optimised_parameters) */}
              {!optimisationResult.optimised_parameters && (
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
              )}

              {/* Tabs for Regular Optimization */}
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
                <div>
                  {/* Show total count and download message */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-gray-400 text-sm">
                        Showing {(optimisationResult.convergence_data || []).length} results
                      </p>
                    </div>
                    {(optimisationResult.convergence_data || []).length >= 50 && (
                      <div className="bg-[#141721] border border-[#85e1fe] rounded-lg p-3 flex items-center gap-3">
                        <span className="text-2xl">ℹ️</span>
                        <div className="flex-1">
                          <p className="text-white text-sm font-semibold mb-1">
                            Showing first 50 results for performance
                          </p>
                          <p className="text-gray-400 text-xs">
                            To view all optimization results, download the <span className="text-[#85e1fe] font-semibold">Full_optimisation_result.csv</span> file from the Generated Files section below.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
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
              </div>
              )}

              {/* Graph Tab */}
              {selectedTab === 'graph' && (
                <div>
                  {/* Optimization Plot from backend */}
                  {optimisationResult.plots_html && optimisationResult.plots_html['optimise_plot.html'] && (
                    <div className="mb-8">
                      <h3 className="mb-2 text-lg font-semibold text-white">Optimization Plot</h3>
                      <iframe
                        title="Optimization Plot"
                        style={{ width: "100%", height: "500px", border: "none", backgroundColor: "#0e1018" }}
                        srcDoc={optimisationResult.plots_html['optimise_plot.html']}
                      />
                    </div>
                  )}

                  {/* Convergence Plot (fallback) */}
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

                  {/* No plots message */}
                  {!optimisationResult.plots_html && 
                   !optimisationResult.convergence_data?.length && 
                   !optimisationResult.optimization_heatmap_data?.length && (
                    <div className="text-center text-gray-400 py-8">
                      No plot data available
                    </div>
                  )}
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

              {/* Generated Files Section */}
              {renderGeneratedFiles(optimisationResult.results_output_listing, optimisationResult.output_dir)}
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
