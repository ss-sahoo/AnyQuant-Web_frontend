"use client"

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { getOptimizationCosts } from '@/app/AllApiCalls'

interface OptimizationCostDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  optimizationType: 'regular' | 'walk_forward'
}

interface CostEstimate {
  cost_estimates: {
    regular: {
      estimated_cost: string
      estimated_time_hours: number
      droplet_size: string
      description: string
    }
    walk_forward: {
      estimated_cost: string
      estimated_time_hours: number
      droplet_size: string
      description: string
    }
  }
  pricing_info: {
    currency: string
    billing_increment: string
    minimum_charge: string
    note: string
  }
}

export const OptimizationCostDialog: React.FC<OptimizationCostDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  optimizationType
}) => {
  const [costs, setCosts] = useState<CostEstimate | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    if (isOpen) {
      loadCosts()
    }
  }, [isOpen])

  const loadCosts = async () => {
    try {
      setLoading(true)
      setError('')
      const costData = await getOptimizationCosts()
      console.log(' Cost data received:', costData)
      setCosts(costData)
    } catch (err: any) {
      console.error('🔍 Error loading costs:', err)
      setError(err.message || 'Failed to load cost estimates')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const currentCostInfo = costs?.cost_estimates?.[optimizationType]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Optimization Cost Estimate</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#85e1fe]"></div>
            <p className="text-gray-400 mt-2">Loading cost estimates...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-4">
            <p className="text-red-200">{error}</p>
            <button 
              onClick={loadCosts}
              className="mt-2 text-red-300 hover:text-red-100 underline"
            >
              Try again
            </button>
          </div>
        )}

        {costs && currentCostInfo && (
          <div className="space-y-4">
            <div className="bg-[#141721] rounded-lg p-4">
              <h3 className="text-lg font-semibold text-white mb-3">
                {optimizationType === 'regular' ? 'Regular Optimization' : 'Walk Forward Optimization'}
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Cost:</span>
                  <span className="text-white font-semibold">
                    ${parseFloat(currentCostInfo.estimated_cost).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Estimated Runtime:</span>
                  <span className="text-white font-semibold">
                    {currentCostInfo.estimated_time_hours} hours
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Droplet Size:</span>
                  <span className="text-white font-semibold">
                    {currentCostInfo.droplet_size}
                  </span>
                </div>
                
                <div className="text-sm text-gray-300 mt-2">
                  {currentCostInfo.description}
                </div>
              </div>
            </div>

            <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-3">
              <p className="text-yellow-200 text-sm">
                <strong>Note:</strong> {costs.pricing_info.note}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2 px-4 bg-[#85e1fe] text-black rounded-md hover:bg-[#6bcae2] transition-colors font-semibold"
              >
                Confirm & Start
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
