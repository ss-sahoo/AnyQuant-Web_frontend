'use client'

import React, { useState, useEffect } from 'react';

interface WalkForwardPlotsExampleProps {
  optimizationId: number;
}

export default function WalkForwardPlotsExample({ optimizationId }: WalkForwardPlotsExampleProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plots, setPlots] = useState<{ [key: string]: { image_url: string } }>({});

  // Method 1: Fetch the full result with plots
  const fetchFullResult = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching full result for optimization ID:', optimizationId);
      const response = await fetch(`/api/walkforward-optimization-results/${optimizationId}/`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('Fetched result:', result);
      
      setData(result);
      
      // Extract plot image URLs
      if (result.plots) {
        setPlots(result.plots);
        console.log('Extracted plots:', result.plots);
      }
    } catch (err: any) {
      console.error('Error fetching full result:', err);
      setError(`Failed to fetch result: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Method 2: Fetch individual plot images
  const fetchIndividualPlots = async () => {
    setLoading(true);
    setError(null);
    
    const plotTypes = ['split_graph', 'equity_trend', 'return_trend', 'max_drawdown', 'sharpe_ratio', 'trades'];
    const newPlots: { [key: string]: { image_url: string } } = {};
    
    try {
      // Fetch all plots in parallel
      await Promise.all(
        plotTypes.map(async (plotType) => {
          try {
            console.log(`Fetching plot: ${plotType}`);
            const response = await fetch(`/api/walkforward-optimization-result/${optimizationId}/plot-image/${plotType}/`);
            
            if (!response.ok) {
              console.warn(`Failed to fetch ${plotType}: ${response.status}`);
              return;
            }
            
            const plotData = await response.json();
            if (plotData.image_url) {
              newPlots[plotType] = { image_url: plotData.image_url };
            }
          } catch (err) {
            console.warn(`Error fetching ${plotType}:`, err);
          }
        })
      );
      
      setPlots(newPlots);
      console.log('Fetched individual plots:', newPlots);
    } catch (err: any) {
      console.error('Error fetching individual plots:', err);
      setError(`Failed to fetch plots: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (optimizationId) {
      fetchFullResult();
    }
  }, [optimizationId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <div className="text-gray-600">Loading walk forward optimization results...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">Error: {error}</div>
        <div className="space-x-2">
          <button 
            onClick={fetchFullResult}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Retry Full Result
          </button>
          <button 
            onClick={fetchIndividualPlots}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Try Individual Plots
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-4">Walk Forward Optimization Results</h2>
        <div className="flex gap-2 mb-4">
          <button 
            onClick={fetchFullResult}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Reload Full Result
          </button>
          <button 
            onClick={fetchIndividualPlots}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Load Individual Plots
          </button>
        </div>
      </div>

      {/* Summary Data */}
      {data && (
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-semibold">{data.status}</div>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-sm text-gray-600">Execution Time</div>
              <div className="font-semibold">{data.execution_time}s</div>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-sm text-gray-600">z-statistic</div>
              <div className="font-semibold">{data.z_statistic?.toFixed(4) || 'N/A'}</div>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-sm text-gray-600">p-value</div>
              <div className="font-semibold">{data.p_value?.toFixed(4) || 'N/A'}</div>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-sm text-gray-600">Hypothesis Decision</div>
              <div className="font-semibold">{data.hypothesis_decision || 'N/A'}</div>
            </div>
            <div className="bg-gray-100 p-4 rounded">
              <div className="text-sm text-gray-600">Message</div>
              <div className="font-semibold">{data.message}</div>
            </div>
          </div>
        </div>
      )}

      {/* Plot Images */}
      {Object.keys(plots).length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-4">Plots</h3>
          
          {/* Method 1: Display specific plots */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {plots.split_graph && (
              <div className="bg-white p-4 rounded shadow">
                <h4 className="font-semibold mb-2">Train/Validation Split</h4>
                <img 
                  src={plots.split_graph.image_url} 
                  alt="Train/Validation Split" 
                  className="w-full h-auto"
                />
              </div>
            )}
            
            {plots.equity_trend && (
              <div className="bg-white p-4 rounded shadow">
                <h4 className="font-semibold mb-2">Equity Trend</h4>
                <img 
                  src={plots.equity_trend.image_url} 
                  alt="Equity Trend" 
                  className="w-full h-auto"
                />
              </div>
            )}
            
            {plots.return_trend && (
              <div className="bg-white p-4 rounded shadow">
                <h4 className="font-semibold mb-2">Return Trend</h4>
                <img 
                  src={plots.return_trend.image_url} 
                  alt="Return Trend" 
                  className="w-full h-auto"
                />
              </div>
            )}
            
            {plots.max_drawdown && (
              <div className="bg-white p-4 rounded shadow">
                <h4 className="font-semibold mb-2">Max Drawdown</h4>
                <img 
                  src={plots.max_drawdown.image_url} 
                  alt="Max Drawdown" 
                  className="w-full h-auto"
                />
              </div>
            )}
            
            {plots.sharpe_ratio && (
              <div className="bg-white p-4 rounded shadow">
                <h4 className="font-semibold mb-2">Sharpe Ratio</h4>
                <img 
                  src={plots.sharpe_ratio.image_url} 
                  alt="Sharpe Ratio" 
                  className="w-full h-auto"
                />
              </div>
            )}
            
            {plots.trades && (
              <div className="bg-white p-4 rounded shadow">
                <h4 className="font-semibold mb-2">Number of Trades</h4>
                <img 
                  src={plots.trades.image_url} 
                  alt="Number of Trades" 
                  className="w-full h-auto"
                />
              </div>
            )}
          </div>

          {/* Method 2: Dynamic rendering of all available plots */}
          <div>
            <h4 className="text-lg font-semibold mb-4">All Available Plots (Dynamic)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(plots).map(([plotType, plotData]) => (
                <div key={plotType} className="bg-white p-4 rounded shadow">
                  <h4 className="font-semibold mb-2">
                    {plotType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </h4>
                  <img 
                    src={plotData.image_url} 
                    alt={plotType} 
                    style={{ maxWidth: '100%' }}
                    className="w-full h-auto"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {Object.keys(plots).length === 0 && !loading && (
        <div className="text-center text-gray-600">
          No plots available. Try loading individual plots.
        </div>
      )}
    </div>
  );
} 