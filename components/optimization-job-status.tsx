"use client"

import React from 'react'
import { X, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react'

interface OptimizationJobStatusProps {
  isOpen: boolean
  onClose: () => void
  job: {
    id?: string
    job_id?: string
    status: string
    progress?: number
    message?: string
    estimated_cost?: string | number  // Can be string or number
    actual_cost?: string | number     // Can be string or number
    runtime_hours?: number
    error_message?: string
    created_at?: string
    result?: any
  } | null
  onCancel?: () => void
}

export const OptimizationJobStatus: React.FC<OptimizationJobStatusProps> = ({
  isOpen,
  onClose,
  job,
  onCancel
}) => {
  if (!isOpen || !job) return null

  const getStatusIcon = () => {
    switch (job.status) {
      case 'creating_droplet':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      case 'running':
        return <Clock className="w-6 h-6 text-yellow-400" />
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-400" />
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-6 h-6 text-red-400" />
      default:
        return <Clock className="w-6 h-6 text-gray-400" />
    }
  }

  const getStatusText = () => {
    switch (job.status) {
      case 'creating_droplet':
        return 'Creating droplet...'
      case 'running':
        return 'Optimization in progress...'
      case 'completed':
        return 'Optimization completed!'
      case 'failed':
        return 'Optimization failed'
      case 'cancelled':
        return 'Optimization cancelled'
      default:
        return job.status
    }
  }

  const getStatusColor = () => {
    switch (job.status) {
      case 'creating_droplet':
      case 'running':
        return 'text-blue-400'
      case 'completed':
        return 'text-green-400'
      case 'failed':
      case 'cancelled':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const canCancel = job.status === 'creating_droplet' || job.status === 'running'

  // Helper function to format cost values
  const formatCost = (cost: string | number | undefined) => {
    if (!cost) return '0.00'
    const numCost = typeof cost === 'string' ? parseFloat(cost) : cost
    return isNaN(numCost) ? '0.00' : numCost.toFixed(2)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1D2D] rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Optimization Status</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Status */}
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <span className={`text-lg font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

          {/* Progress Bar */}
          {(job.status === 'creating_droplet' || job.status === 'running') && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Progress</span>
                <span className="text-gray-400">
                  {job.progress ? `${job.progress}%` : 'Estimating...'}
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-[#85e1fe] h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: job.progress ? `${Math.min(job.progress, 100)}%` : '30%',
                    animation: !job.progress ? 'pulse 2s infinite' : 'none'
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Job Info */}
          <div className="bg-[#141721] rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-400">Job ID:</span>
              <span className="text-white font-mono text-sm">{job.id || job.job_id}</span>
            </div>
            
            {job.estimated_cost && (
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated Cost:</span>
                <span className="text-white">${formatCost(job.estimated_cost)}</span>
              </div>
            )}
            
            {job.actual_cost && (
              <div className="flex justify-between">
                <span className="text-gray-400">Actual Cost:</span>
                <span className="text-white">${formatCost(job.actual_cost)}</span>
              </div>
            )}
            
            {job.runtime_hours && (
              <div className="flex justify-between">
                <span className="text-gray-400">Runtime:</span>
                <span className="text-white">{job.runtime_hours.toFixed(1)} hours</span>
              </div>
            )}
          </div>

          {/* Message */}
          {job.message && (
            <div className="bg-blue-900 border border-blue-700 rounded-lg p-3">
              <p className="text-blue-200 text-sm">{job.message}</p>
            </div>
          )}

          {/* Error Message */}
          {job.error_message && (
            <div className="bg-red-900 border border-red-700 rounded-lg p-3">
              <p className="text-red-200 text-sm">{job.error_message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {canCancel && onCancel && (
              <button
                onClick={onCancel}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel Job
              </button>
            )}
            
            {job.status === 'completed' && (
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-[#85e1fe] text-black rounded-md hover:bg-[#6bcae2] transition-colors font-semibold"
              >
                View Results
              </button>
            )}
            
            {(job.status === 'failed' || job.status === 'cancelled') && (
              <button
                onClick={onClose}
                className="flex-1 py-2 px-4 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
