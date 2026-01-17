"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Search, Loader2, Edit2, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { listCustomComponents, deleteCustomComponent, getCustomComponent } from "@/app/AllApiCalls"

interface CustomComponent {
  id: number
  name: string
  type: string
  status: string
  language?: string
  code?: string
  parameters?: Record<string, any>
}

interface ComponentsSidebarProps {
  onComponentSelect: (component: string, customComponentData?: CustomComponent) => void
  onEditCustomComponent?: (component: CustomComponent) => void
}

export function ComponentsSidebar({ onComponentSelect, onEditCustomComponent }: ComponentsSidebarProps) {
  const [showAllBasic, setShowAllBasic] = useState(false)
  const [showAllIndicators, setShowAllIndicators] = useState(false)
  const [showAllBehaviors, setShowAllBehaviors] = useState(false)
  const [showAllActions, setShowAllActions] = useState(false)
  const [showAllTradeManagement, setShowAllTradeManagement] = useState(false)
  const [showAllCustomIndicators, setShowAllCustomIndicators] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const [indicatorSearch, setIndicatorSearch] = useState("")
  const [behaviorSearch, setBehaviorSearch] = useState("")
  const [customIndicatorSearch, setCustomIndicatorSearch] = useState("")

  // Custom components state
  const [customComponents, setCustomComponents] = useState<CustomComponent[]>([])
  const [isLoadingCustom, setIsLoadingCustom] = useState(false)
  const [customError, setCustomError] = useState<string | null>(null)

  // Function to fetch custom components
  const fetchCustomComponents = async () => {
    setIsLoadingCustom(true)
    setCustomError(null)
    try {
      const components = await listCustomComponents()
      // Only show active components
      const activeComponents = components.filter((c: CustomComponent) => c.status === "active")
      setCustomComponents(activeComponents)
    } catch (error: any) {
      // Silently fail if custom components endpoint doesn't exist
      // This is expected if the backend doesn't have this feature yet
      setCustomComponents([])
    } finally {
      setIsLoadingCustom(false)
    }
  }

  // Fetch custom components on mount
  useEffect(() => {
    fetchCustomComponents()
  }, [])

  // Listen for refresh event from developer mode
  useEffect(() => {
    const handleRefresh = (e: CustomEvent) => {
      // If components are passed in the event, use them directly
      if (e.detail) {
        const activeComponents = e.detail.filter((c: CustomComponent) => c.status === "active")
        setCustomComponents(activeComponents)
      } else {
        // Otherwise fetch fresh
        fetchCustomComponents()
      }
    }

    window.addEventListener('refresh-custom-components', handleRefresh as EventListener)
    return () => {
      window.removeEventListener('refresh-custom-components', handleRefresh as EventListener)
    }
  }, [])

  // Filter custom indicators based on search
  const filteredCustomIndicators = customComponents.filter((component) =>
    component.type === "indicator" && component.name.toLowerCase().includes(customIndicatorSearch.toLowerCase())
  )

  // Filter custom behaviors
  const customBehaviors = customComponents.filter((component) => component.type === "behavior")
  
  // Filter custom trade management
  const customTradeManagement = customComponents.filter((component) => component.type === "trade_management")

  // State for showing all custom behaviors and trade management
  const [showAllCustomBehaviors, setShowAllCustomBehaviors] = useState(false)
  const [showAllCustomTradeManagement, setShowAllCustomTradeManagement] = useState(false)
  const [customBehaviorSearch, setCustomBehaviorSearch] = useState("")
  const [customTradeManagementSearch, setCustomTradeManagementSearch] = useState("")

  // Filtered custom behaviors and trade management
  const filteredCustomBehaviors = customBehaviors.filter((component) =>
    component.name.toLowerCase().includes(customBehaviorSearch.toLowerCase())
  )
  const filteredCustomTradeManagement = customTradeManagement.filter((component) =>
    component.name.toLowerCase().includes(customTradeManagementSearch.toLowerCase())
  )

  // Custom indicators only
  const customIndicators = customComponents.filter((component) => component.type === "indicator")

  // Complete list of basic components
  const allBasicComponents = [
    "If",
   
    // "Then",
    "Timeframe",
  
    "At Candle",
    
    "And",
    // "Or",
    // "Not",
    // "Else",
    // "For Each",
    // "While",
    // "Until",
    // "After",
    // "Before",
    // "Between",
    // "Outside",
  ]

  // Complete list of indicators
  const allIndicators = [
    "RSI",
    "Volume",
     "MACD",
    "Bollinger",
    "Price",
    "Stochastic",
     "ATR",
     "SuperTrend",   
    "GENERAL PA",
    "Gradient",
     "MA",
    "Volume Delta",
    "Cumulative Volume Delta",
    "Historical Price Level",
    "Candle Size",
    // "SMA",
    // "WMA",
    // "VWMA",
    // "RSI_MA",
    // "Volume_MA",
    // "ADX",
    // "CCI",
    // "ROC",
    // "MFI",
    // "OBV",
    // "Ichimoku",
    // "Parabolic SAR",
    // "Pivot Points",
    // "Fibonacci",
    // "Keltner Channel",
    // "Momentum",
    // "Williams %R",
    // "Awesome Oscillator",
    // "TRIX",
    // "Chaikin Money Flow",
  ]

  // Complete list of behaviors
  const allBehaviors = [
    "Cross Above",
    "Cross Below",
    
    // "Inside Channel",
    "Increasing",
    "Decreasing",
    "Above",
    "Below",
    "At most above points",
    "At most below points",
    "Accumulate",
    "Then",
    // "Rising",
   
    // "Equal to",
    // "Not equal to",
    // "Increasing",
    // "Decreasing",
    // "Flat",
    // "Diverging",
    // "Converging",
    // "Breaking out",
    // "Pulling back",
    // "Consolidating",
    // "Trending",
    // "Reversing",
    // "Oscillating",
    // "Oversold",
    // "Overbought",
    // "Neutral",
  ]

  // Complete list of actions
  const allActions = [
    "Long",
    "Short",
    "Wait",
    "SL",
    "TP",
    "Partial TP",
    "Manage Exit",
    "Buy",
    "Sell",
    "Hold",
    "Exit",
    "Scale in",
    "Scale out",
    "Hedge",
    "Reverse position",
    "Partial close",
     "Manage",
    "Close",
    "Cancel",
    "No Trade",
    "Reverse",
    // "SL",
    // "TP",
    "Trailing stop",
    "Break even",
    "Move stop",
    "Adjust target",
    "Lock profit",
    "Add to position",
    "Reduce position",
    "Split position",
    "Merge positions",
  ]



  // Filter indicators based on search
  const filteredIndicators = allIndicators.filter((indicator) =>
    indicator.toLowerCase().includes(indicatorSearch.toLowerCase()),
  )

  // Filter behaviors based on search
  const filteredBehaviors = allBehaviors.filter((behavior) =>
    behavior.toLowerCase().includes(behaviorSearch.toLowerCase()),
  )

  return (
    <div className="w-[300px] min-w-[300px] bg-[#141721] border-l border-gray-800 flex flex-col h-screen">
      <div className="p-4 border-b border-gray-800">
        <h2 className="text-xl font-semibold">Components</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Basic Components */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <h3 className="font-medium mb-3">Basic Components</h3>
          <div className="flex flex-wrap gap-2">
            {(showAllBasic ? allBasicComponents : allBasicComponents.slice(0, 7)).map((component) => (
              <Button
                key={component}
                variant="outline"
                size="sm"
                className="bg-[#2B2E38] border-0 hover:bg-gray-700"
                onClick={() => onComponentSelect(component)}
              >
                {component}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
              onClick={() => setShowAllBasic(!showAllBasic)}
            >
              {showAllBasic ? "Show less" : "Show all"}
            </Button>
          </div>
        </div>

        {/* Indicators */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Indicators</h3>
           
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              className="pl-8 bg-[#2B2E38] border-0"
              placeholder="Search indicators"
              value={indicatorSearch}
              onChange={(e) => setIndicatorSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(indicatorSearch !== ""
              ? filteredIndicators
              : showAllIndicators
                ? allIndicators
                : allIndicators.slice(0, 6)
            ).map((indicator) => (
              <Button
                key={indicator}
                variant="outline"
                size="sm"
                className="bg-[#2B2E38] border-0 hover:bg-gray-700"
                onClick={() => onComponentSelect(indicator)}
              >
                {indicator}
              </Button>
            ))}
            {indicatorSearch === "" && (
              <Button
                variant="outline"
                size="sm"
                className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
                onClick={() => setShowAllIndicators(!showAllIndicators)}
              >
                {showAllIndicators ? "Show less" : "Show all"}
              </Button>
            )}
          </div>
        </div>

        {/* Custom Indicators */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Custom Indicators</h3>
          </div>
          
          {isLoadingCustom ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <span className="ml-2 text-sm text-gray-400">Loading...</span>
            </div>
          ) : customError ? (
            <p className="text-sm text-red-400">{customError}</p>
          ) : customIndicators.length === 0 ? (
            <p className="text-sm text-gray-500">No custom indicators yet. Create one in Developer Mode.</p>
          ) : (
            <>
              {customIndicators.length > 3 && (
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    className="pl-8 bg-[#2B2E38] border-0"
                    placeholder="Search custom indicators"
                    value={customIndicatorSearch}
                    onChange={(e) => setCustomIndicatorSearch(e.target.value)}
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(customIndicatorSearch !== ""
                  ? filteredCustomIndicators
                  : showAllCustomIndicators
                    ? customIndicators
                    : customIndicators.slice(0, 4)
                ).map((component) => (
                  <div key={component.id} className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#2B2E38] border-0 hover:bg-gray-700 flex-1"
                      onClick={async () => {
                        // Fetch full component details to get parameters
                        try {
                          const fullComponent = await getCustomComponent(component.id)
                          onComponentSelect(fullComponent.name, fullComponent)
                        } catch (error) {
                          console.error("Failed to get component details:", error)
                          // Fallback to basic component data
                          onComponentSelect(component.name, component)
                        }
                      }}
                    >
                      {component.name}
                    </Button>
                    {onEditCustomComponent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8 hover:bg-gray-700"
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const fullComponent = await getCustomComponent(component.id)
                            onEditCustomComponent(fullComponent)
                          } catch (error) {
                            console.error("Failed to get component:", error)
                          }
                        }}
                        title="Edit"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-8 w-8 hover:bg-red-900/50 text-red-400"
                      disabled={deletingId === component.id}
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (confirm(`Delete "${component.name}"?`)) {
                          setDeletingId(component.id)
                          try {
                            await deleteCustomComponent(component.id)
                            setCustomComponents(prev => prev.filter(c => c.id !== component.id))
                          } catch (error) {
                            console.error("Failed to delete component:", error)
                          } finally {
                            setDeletingId(null)
                          }
                        }
                      }}
                      title="Delete"
                    >
                      {deletingId === component.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
                {customIndicatorSearch === "" && customIndicators.length > 4 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
                    onClick={() => setShowAllCustomIndicators(!showAllCustomIndicators)}
                  >
                    {showAllCustomIndicators ? "Show less" : "Show all"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Custom Behaviors */}
        {/* <div className="mb-6 bg-black p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Custom Behaviors</h3>
          </div>
          
          {isLoadingCustom ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : customBehaviors.length === 0 ? (
            <p className="text-sm text-gray-500">No custom behaviors yet. Create one in Developer Mode.</p>
          ) : (
            <>
              {customBehaviors.length > 3 && (
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    className="pl-8 bg-[#2B2E38] border-0"
                    placeholder="Search custom behaviors"
                    value={customBehaviorSearch}
                    onChange={(e) => setCustomBehaviorSearch(e.target.value)}
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(customBehaviorSearch !== ""
                  ? filteredCustomBehaviors
                  : showAllCustomBehaviors
                    ? customBehaviors
                    : customBehaviors.slice(0, 4)
                ).map((component) => (
                  <div key={component.id} className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#2B2E38] border-0 hover:bg-gray-700 flex-1"
                      onClick={async () => {
                        try {
                          const fullComponent = await getCustomComponent(component.id)
                          onComponentSelect(fullComponent.name, fullComponent)
                        } catch (error) {
                          console.error("Failed to get component details:", error)
                          onComponentSelect(component.name, component)
                        }
                      }}
                    >
                      {component.name}
                    </Button>
                    {onEditCustomComponent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8 hover:bg-gray-700"
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const fullComponent = await getCustomComponent(component.id)
                            onEditCustomComponent(fullComponent)
                          } catch (error) {
                            console.error("Failed to get component:", error)
                          }
                        }}
                        title="Edit"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-8 w-8 hover:bg-red-900/50 text-red-400"
                      disabled={deletingId === component.id}
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (confirm(`Delete "${component.name}"?`)) {
                          setDeletingId(component.id)
                          try {
                            await deleteCustomComponent(component.id)
                            setCustomComponents(prev => prev.filter(c => c.id !== component.id))
                          } catch (error) {
                            console.error("Failed to delete component:", error)
                          } finally {
                            setDeletingId(null)
                          }
                        }
                      }}
                      title="Delete"
                    >
                      {deletingId === component.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
                {customBehaviorSearch === "" && customBehaviors.length > 4 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
                    onClick={() => setShowAllCustomBehaviors(!showAllCustomBehaviors)}
                  >
                    {showAllCustomBehaviors ? "Show less" : "Show all"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div> */}

        {/* Custom Trade Management */}
        {/* <div className="mb-6 bg-black p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Custom Trade Management</h3>
          </div>
          
          {isLoadingCustom ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : customTradeManagement.length === 0 ? (
            <p className="text-sm text-gray-500">No custom trade management yet. Create one in Developer Mode.</p>
          ) : (
            <>
              {customTradeManagement.length > 3 && (
                <div className="relative mb-3">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                  <Input
                    className="pl-8 bg-[#2B2E38] border-0"
                    placeholder="Search custom trade management"
                    value={customTradeManagementSearch}
                    onChange={(e) => setCustomTradeManagementSearch(e.target.value)}
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {(customTradeManagementSearch !== ""
                  ? filteredCustomTradeManagement
                  : showAllCustomTradeManagement
                    ? customTradeManagement
                    : customTradeManagement.slice(0, 4)
                ).map((component) => (
                  <div key={component.id} className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-[#2B2E38] border-0 hover:bg-gray-700 flex-1"
                      onClick={async () => {
                        try {
                          const fullComponent = await getCustomComponent(component.id)
                          onComponentSelect(fullComponent.name, fullComponent)
                        } catch (error) {
                          console.error("Failed to get component details:", error)
                          onComponentSelect(component.name, component)
                        }
                      }}
                    >
                      {component.name}
                    </Button>
                    {onEditCustomComponent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="p-1 h-8 w-8 hover:bg-gray-700"
                        onClick={async (e) => {
                          e.stopPropagation()
                          try {
                            const fullComponent = await getCustomComponent(component.id)
                            onEditCustomComponent(fullComponent)
                          } catch (error) {
                            console.error("Failed to get component:", error)
                          }
                        }}
                        title="Edit"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-1 h-8 w-8 hover:bg-red-900/50 text-red-400"
                      disabled={deletingId === component.id}
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (confirm(`Delete "${component.name}"?`)) {
                          setDeletingId(component.id)
                          try {
                            await deleteCustomComponent(component.id)
                            setCustomComponents(prev => prev.filter(c => c.id !== component.id))
                          } catch (error) {
                            console.error("Failed to delete component:", error)
                          } finally {
                            setDeletingId(null)
                          }
                        }
                      }}
                      title="Delete"
                    >
                      {deletingId === component.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                ))}
                {customTradeManagementSearch === "" && customTradeManagement.length > 4 && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
                    onClick={() => setShowAllCustomTradeManagement(!showAllCustomTradeManagement)}
                  >
                    {showAllCustomTradeManagement ? "Show less" : "Show all"}
                  </Button>
                )}
              </div>
            </>
          )}
        </div> */}

        {/* Behaviours */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <h3 className="font-medium mb-3">Behaviours</h3>
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              className="pl-8 bg-[#2B2E38] border-0"
              placeholder="Search behaviours"
              value={behaviorSearch}
              onChange={(e) => setBehaviorSearch(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {(behaviorSearch !== ""
              ? filteredBehaviors
              : showAllBehaviors
                ? allBehaviors
                : allBehaviors.slice(0, 6)
            ).map((behavior) => (
              <Button
                key={behavior}
                variant="outline"
                size="sm"
                className="bg-[#2B2E38] border-0 hover:bg-gray-700"
                onClick={() => onComponentSelect(behavior)}
              >
                {behavior}
              </Button>
            ))}
            {behaviorSearch === "" && (
              <Button
                variant="outline"
                size="sm"
                className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
                onClick={() => setShowAllBehaviors(!showAllBehaviors)}
              >
                {showAllBehaviors ? "Show less" : "Show all"}
              </Button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <h3 className="font-medium mb-3">Actions</h3>
          <div className="flex flex-wrap gap-2">
            {(showAllActions ? allActions : allActions.slice(0, 5)).map((action) => (
              <Button
                key={action}
                variant="outline"
                size="sm"
                className="bg-[#2B2E38] border-0 hover:bg-gray-700"
                onClick={() => onComponentSelect(action)}
              >
                {action}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
              onClick={() => setShowAllActions(!showAllActions)}
            >
              {showAllActions ? "Show less" : "Show all"}
            </Button>
          </div>
        </div>

        
      </div>
    </div>
  )
}
