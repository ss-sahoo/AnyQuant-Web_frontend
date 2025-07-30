import React, { useState, useEffect } from 'react'

interface TradingTypeConfigProps {
  strategyId?: number | null
  isVisible: boolean
  onClose: () => void
  onConfigChange: (config: any) => void
  initialConfig?: any
}

interface TradingTypeConfig {
  NewTrade: string
  commission: number
  nTrade_max: number
  margin: number
  lot: string
  cash: number
}

export default function TradingTypeConfig({
  strategyId,
  isVisible,
  onClose,
  onConfigChange,
  initialConfig
}: TradingTypeConfigProps) {
  const [config, setConfig] = useState<TradingTypeConfig>({
    NewTrade: "MTOOTAAT",
    commission: 0.00007,
    nTrade_max: 1,
    margin: 1,
    lot: "mini",
    cash: 100000,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Load initial configuration
  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig)
    }
  }, [initialConfig])

  // Load default configuration from API
  useEffect(() => {
    if (isVisible && !initialConfig) {
      loadDefaultConfig()
    }
  }, [isVisible, initialConfig])

  const loadDefaultConfig = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/trading-type-config/')
      if (!response.ok) {
        throw new Error('Failed to load default configuration')
      }
      
      const defaultConfig = await response.json()
      setConfig(defaultConfig)
    } catch (err) {
      console.error('Error loading default config:', err)
      setError('Failed to load default configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      if (!strategyId) {
        throw new Error('Strategy ID is required to save configuration')
      }

      const response = await fetch('/api/trading-type-config/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          strategy_id: strategyId,
          TradingType: config,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to save configuration')
      }

      setSuccess('Configuration saved successfully!')
      onConfigChange(config)
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err: any) {
      console.error('Error saving config:', err)
      setError(err.message || 'Failed to save configuration')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setConfig({
      NewTrade: "MTOOTAAT",
      commission: 0.00007,
      nTrade_max: 1,
      margin: 1,
      lot: "mini",
      cash: 100000,
    })
    setError(null)
    setSuccess(null)
  }

  const handleInputChange = (field: keyof TradingTypeConfig, value: string | number) => {
    setConfig(prev => ({
      ...prev,
      [field]: value,
    }))
    setError(null)
    setSuccess(null)
  }

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1A1D2D] rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-white">Trading Configuration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6BCAE2]"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* New Trade Type */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">New Trade Type</label>
            <select
              value={config.NewTrade}
              onChange={(e) => handleInputChange('NewTrade', e.target.value)}
              className="w-full bg-[#2B2E38] border border-gray-600 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#6BCAE2]"
            >
              <option value="MTOOTAAT">MTOOTAAT</option>
              <option value="OTOOTAAT">OTOOTAAT</option>
              <option value="OTOOCANCEL">OTOOCANCEL</option>
            </select>
          </div>

          {/* Commission */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Commission</label>
            <input
              type="number"
              step="0.00001"
              min="0.00001"
              max="0.001"
              value={config.commission}
              onChange={(e) => handleInputChange('commission', parseFloat(e.target.value))}
              className="w-full bg-[#2B2E38] border border-gray-600 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#6BCAE2]"
            />
          </div>

          {/* Max Trades */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Max Trades</label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.nTrade_max}
              onChange={(e) => handleInputChange('nTrade_max', parseInt(e.target.value))}
              className="w-full bg-[#2B2E38] border border-gray-600 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#6BCAE2]"
            />
          </div>

          {/* Margin */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Margin</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              max="10.0"
              value={config.margin}
              onChange={(e) => handleInputChange('margin', parseFloat(e.target.value))}
              className="w-full bg-[#2B2E38] border border-gray-600 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#6BCAE2]"
            />
          </div>

          {/* Lot Size */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Lot Size</label>
            <select
              value={config.lot}
              onChange={(e) => handleInputChange('lot', e.target.value)}
              className="w-full bg-[#2B2E38] border border-gray-600 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#6BCAE2]"
            >
              <option value="mini">Mini (0.01)</option>
              <option value="micro">Micro (0.001)</option>
              <option value="standard">Standard (1.0)</option>
            </select>
          </div>

          {/* Initial Cash */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Initial Cash</label>
            <input
              type="number"
              min="1000"
              max="1000000"
              step="1000"
              value={config.cash}
              onChange={(e) => handleInputChange('cash', parseInt(e.target.value))}
              className="w-full bg-[#2B2E38] border border-gray-600 rounded-md p-3 text-white focus:outline-none focus:ring-1 focus:ring-[#6BCAE2]"
            />
          </div>
        </div>

        {/* Configuration Summary */}
        <div className="mt-6 p-4 bg-[#2B2E38] rounded-lg">
          <h3 className="text-lg font-medium text-white mb-3">Configuration Summary</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
            <div>New Trade: <span className="text-white">{config.NewTrade}</span></div>
            <div>Commission: <span className="text-white">{config.commission}</span></div>
            <div>Max Trades: <span className="text-white">{config.nTrade_max}</span></div>
            <div>Margin: <span className="text-white">{config.margin}</span></div>
            <div>Lot Size: <span className="text-white">{config.lot}</span></div>
            <div>Initial Cash: <span className="text-white">${config.cash.toLocaleString()}</span></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={handleReset}
            disabled={isLoading}
            className="px-4 py-2 bg-[#2B2E38] border border-gray-600 text-white rounded-md hover:bg-[#3B3E48] transition-colors disabled:opacity-50"
          >
            Reset to Default
          </button>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 bg-[#2B2E38] border border-gray-600 text-white rounded-md hover:bg-[#3B3E48] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || !strategyId}
            className="px-4 py-2 bg-[#6BCAE2] hover:bg-[#5AB9D1] text-black rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>

        {!strategyId && (
          <div className="mt-4 p-3 bg-yellow-900 border border-yellow-700 text-yellow-200 rounded text-sm">
            Note: Configuration can only be saved after the strategy is created.
          </div>
        )}
      </div>
    </div>
  )
} 