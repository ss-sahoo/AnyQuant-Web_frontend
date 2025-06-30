"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from 'lucide-react'

interface CrossingDownSettingsModalProps {
  onClose: () => void
  currentInp1?: any // Information about the current inp1 indicator
  onSave: (settings: {
    valueType: string
    customValue?: string
    indicator?: string
    timeframe?: string
    band?: string
    timeperiod?: number
    // RSI parameters
    rsiLength?: number
    // RSI-MA parameters
    rsiMaLength?: number
    maLength?: number
    rsiSource?: string
    maType?: string
    bbStdDev?: number
    bbSource?: string
    volumeMaLength?: number
    fastPeriod?: number
    slowPeriod?: number
    signalPeriod?: number
    kPeriod?: number
    dPeriod?: number
    period?: number
  }) => void
  onNext: (indicator: string, timeframe: string) => void
}

export function CrossingDownSettingsModal({ onClose, currentInp1, onSave, onNext }: CrossingDownSettingsModalProps) {
  const [valueType, setValueType] = useState("value")
  const [customValue, setCustomValue] = useState("50")
  const [indicator, setIndicator] = useState("")
  const [timeframe, setTimeframe] = useState("3h")
  const [band, setBand] = useState("upperband")
  const [timeperiod, setTimeperiod] = useState(17)
  const [customTimeframe, setCustomTimeframe] = useState("")

  // RSI parameters
  const [rsiLength, setRsiLength] = useState(14)

  // RSI-MA parameters
  const [rsiMaLength, setRsiMaLength] = useState(14)
  const [maLength, setMaLength] = useState(14)
  const [rsiSource, setRsiSource] = useState("Close")
  const [maType, setMaType] = useState("SMA")
  const [bbStdDev, setBbStdDev] = useState(2.0)

  // Volume-MA parameters
  const [volumeMaLength, setVolumeMaLength] = useState(20)

  // Additional indicator parameters
  const [fastPeriod, setFastPeriod] = useState(12)
  const [slowPeriod, setSlowPeriod] = useState(26)
  const [signalPeriod, setSignalPeriod] = useState(9)
  const [kPeriod, setKPeriod] = useState(14)
  const [dPeriod, setDPeriod] = useState(3)
  const [period, setPeriod] = useState(14)
  const [bbSource, setBbSource] = useState("close")


  // Get available existing indicators based on inp1
  const getExistingIndicatorOptions = () => {
    if (!currentInp1) return []

    const options = []

    if (currentInp1.name === "RSI" || currentInp1.input === "rsi") {
      options.push({ value: "rsi", label: "RSI" })
      options.push({ value: "rsi-ma", label: "RSI-MA" })
    } else if (currentInp1.name === "RSI_MA") {
      options.push({ value: "rsi", label: "RSI" })
      options.push({ value: "rsi-ma", label: "RSI-MA" })
    } else if (currentInp1.name === "BBANDS") {
      options.push({ value: "bollinger", label: "Bollinger Bands" })
      // Add OHLC options for BBANDS
      options.push({ value: "open", label: "Open" })
      options.push({ value: "high", label: "High" })
      options.push({ value: "low", label: "Low" })
      options.push({ value: "close", label: "Close" })
    } else if (currentInp1.name === "MACD") {
      options.push({ value: "macd", label: "MACD" })
    } else if (
      currentInp1.name === "Volume_MA" ||
      currentInp1.input === "volume" ||
      (currentInp1.type === "CUSTOM_I" && currentInp1.name === "Volume_MA")
    ) {
      options.push({ value: "volume", label: "Volume" })
      options.push({ value: "volume-ma", label: "Volume MA" })
    } else if (["open", "close", "high", "low"].includes(currentInp1.input?.toLowerCase() || "")) {
      // If inp1 is a price indicator, show all OHLC options
      options.push({ value: "open", label: "Open" })
      options.push({ value: "high", label: "High" })
      options.push({ value: "low", label: "Low" })
      options.push({ value: "close", label: "Close" })
    }

    return options
  }

  const existingIndicatorOptions = getExistingIndicatorOptions()

  // Initialize parameters based on current inp1
  useEffect(() => {
    if (currentInp1) {
      if (currentInp1.name === "RSI") {
        setRsiLength(currentInp1.input_params?.timeperiod || 14)
        setRsiMaLength(currentInp1.input_params?.timeperiod || 14) // Always sync RSI_MA length to RSI timeperiod
        setRsiSource(currentInp1.input_params?.rsi_source || "Close")
        setMaType(currentInp1.input_params?.ma_type || "SMA")
        setBbStdDev(currentInp1.input_params?.bb_stddev || 2.0)
      } else if (currentInp1.name === "RSI_MA") {
        setRsiMaLength(currentInp1.input_params?.rsi_length || 14)
        setMaLength(currentInp1.input_params?.ma_length || 14)
        setRsiSource(currentInp1.input_params?.rsi_source || "Close")
        setMaType(currentInp1.input_params?.ma_type || "SMA")
        setBbStdDev(currentInp1.input_params?.bb_stddev || 2.0)
      } else if (currentInp1.name === "BBANDS") {
        setTimeperiod(currentInp1.input_params?.timeperiod || 17)
        setBand(currentInp1.input || "upperband")
      } else if (
        currentInp1.name === "Volume_MA" ||
        (currentInp1.type === "CUSTOM_I" && currentInp1.name === "Volume_MA")
      ) {
        setVolumeMaLength(currentInp1.input_params?.ma_length || 20)
        // Make sure to set the indicator to "volume-ma" if that's the selected type
        if (valueType === "indicator" || valueType === "other") {
          setIndicator("volume-ma")
        }
      }

      if (currentInp1.timeframe) {
        setTimeframe(currentInp1.timeframe)
      }
    }
  }, [currentInp1])

  // Add a helper to get read-only parameter values for existing indicators
  const getReadOnlyParams = () => {
    if (!currentInp1) return {}
    if (indicator === "rsi") {
      return {
        rsiLength: currentInp1.input_params?.timeperiod || 14,
        rsiSource: currentInp1.input_params?.source || "close",
      }
    }
    if (indicator === "rsi-ma") {
      // If currentInp1 is RSI, use its timeperiod for RSI_MA's rsi_length
      // If currentInp1 is RSI_MA, use its rsi_length
      const rsiLength = currentInp1.name === "RSI"
        ? currentInp1.input_params?.timeperiod || 14
        : currentInp1.input_params?.rsi_length || 14
      return {
        rsiLength: rsiLength,
        maLength: currentInp1.input_params?.ma_length || 14,
        rsiSource: currentInp1.input_params?.rsi_source || currentInp1.input_params?.source || "Close",
        maType: currentInp1.input_params?.ma_type || "SMA",
        bbStdDev: currentInp1.input_params?.bb_stddev || 2.0,
      }
    }
    if (indicator === "volume-ma") {
      return {
        volumeMaLength: currentInp1.input_params?.ma_length || 20,
      }
    }
    return {}
  }

  // Modified to render read-only parameter displays for existing indicators
  const renderExistingIndicatorParams = () => {
    if (valueType !== "indicator" || !indicator) return null
    const params = getReadOnlyParams()
    const readOnlyStyle = "bg-gray-100 text-gray-600 cursor-not-allowed"
    if (indicator === "rsi") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="rsiLength" className="block text-sm font-medium text-gray-600 mb-2">
              RSI Length (from original indicator)
            </Label>
            <div className={`w-full border border-gray-300 rounded-md px-3 py-2 ${readOnlyStyle}`}>{params.rsiLength}</div>
          </div>
          <div>
            <Label htmlFor="rsiSource" className="block text-sm font-medium text-gray-600 mb-2">
              RSI Source (from original indicator)
            </Label>
            <div className={`w-full border border-gray-300 rounded-md px-3 py-2 ${readOnlyStyle}`}>{params.rsiSource}</div>
          </div>
        </div>
      )
    }
    if (indicator === "rsi-ma") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="rsiLength" className="block text-sm font-medium text-gray-600 mb-2">
              RSI Length (from original indicator)
            </Label>
            <div className={`w-full border border-gray-300 rounded-md px-3 py-2 ${readOnlyStyle}`}>{params.rsiLength}</div>
          </div>
          <div>
            <Label htmlFor="maLength" className="block text-sm font-medium text-gray-600 mb-2">
              MA Length (from original indicator)
            </Label>
            <div className={`w-full border border-gray-300 rounded-md px-3 py-2 ${readOnlyStyle}`}>{params.maLength}</div>
          </div>
          <div>
            <Label htmlFor="rsiSource" className="block text-sm font-medium text-gray-600 mb-2">
              RSI Source (from original indicator)
            </Label>
            <div className={`w-full border border-gray-300 rounded-md px-3 py-2 ${readOnlyStyle}`}>{params.rsiSource}</div>
          </div>
          <div>
            <Label htmlFor="maType" className="block text-sm font-medium text-gray-600 mb-2">
              MA Type (from original indicator)
            </Label>
            <div className={`w-full border border-gray-300 rounded-md px-3 py-2 ${readOnlyStyle}`}>{params.maType}</div>
          </div>
          <div>
            <Label htmlFor="bbStdDev" className="block text-sm font-medium text-gray-600 mb-2">
              BB Std Dev (from original indicator)
            </Label>
            <div className={`w-full border border-gray-300 rounded-md px-3 py-2 ${readOnlyStyle}`}>{params.bbStdDev}</div>
          </div>
        </div>
      )
    }
    if (indicator === "volume-ma") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="volumeMaLength" className="block text-sm font-medium text-gray-600 mb-2">
              MA Length (from original indicator)
            </Label>
            <div className={`w-full border border-gray-300 rounded-md px-3 py-2 ${readOnlyStyle}`}>{params.volumeMaLength}</div>
          </div>
        </div>
      )
    }
    if (["open", "high", "low", "close"].includes(indicator)) {
      return (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            No additional parameters required for {indicator.charAt(0).toUpperCase() + indicator.slice(1)} price.
          </div>
        </div>
      )
    }
    if (indicator === "volume") {
      return (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">No additional parameters required for Volume.</div>
        </div>
      )
    }
    return null
  }

  const handleSave = () => {
    let finalRsiMaLength = rsiMaLength
    let finalMaLength = maLength
    let finalRsiSource = rsiSource
    let finalMaType = maType
    let finalBbStdDev = bbStdDev
    if (indicator === "rsi-ma" && currentInp1) {
      finalRsiMaLength = currentInp1.input_params?.rsi_length || currentInp1.input_params?.timeperiod || 14
      finalMaLength = currentInp1.input_params?.ma_length || 14
      finalRsiSource = currentInp1.input_params?.rsi_source || currentInp1.input_params?.source || "Close"
      finalMaType = currentInp1.input_params?.ma_type || "SMA"
      finalBbStdDev = currentInp1.input_params?.bb_stddev || 2.0
    }
    onSave({
      valueType,
      customValue,
      indicator,
      timeframe,
      band,
      timeperiod,
      rsiLength,
      rsiMaLength: finalRsiMaLength,
      maLength: finalMaLength,
      rsiSource: finalRsiSource,
      maType: finalMaType,
      bbStdDev: finalBbStdDev,
      bbSource,
      volumeMaLength,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      kPeriod,
      dPeriod,
      period
    })
    onClose()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] bg-white p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <DialogTitle className="text-lg font-medium text-black">Crossing Below Settings</DialogTitle>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          <div className="mb-4">
            <Label className="block text-sm font-medium text-black mb-2">Value type</Label>
            <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-md">
              <button
                className={`py-2 px-3 text-sm rounded-md text-center ${
                  valueType === "value" ? "bg-white shadow-sm text-black" : "text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setValueType("value")}
              >
                Value
              </button>
              <button
                className={`py-2 px-3 text-sm rounded-md text-center ${
                  valueType === "indicator" ? "bg-white shadow-sm text-black" : "text-gray-700 hover:bg-gray-200"
                } ${existingIndicatorOptions.length === 0 ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => existingIndicatorOptions.length > 0 && setValueType("indicator")}
                disabled={existingIndicatorOptions.length === 0}
              >
                Existing Indicator
              </button>
              <button
                className={`py-2 px-3 text-sm rounded-md text-center ${
                  valueType === "other" ? "bg-white shadow-sm text-black" : "text-gray-700 hover:bg-gray-200"
                }`}
                onClick={() => setValueType("other")}
              >
                Other Indicator
              </button>
            </div>
          </div>

          {valueType === "value" && (
            <div className="mb-4">
              <Label htmlFor="customValue" className="block text-sm font-medium text-black mb-2">
                Custom Value
              </Label>
              <Input
                id="customValue"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                type="number"
                className="w-full border border-gray-300 rounded-md text-black"
                placeholder="Enter value"
              />
            </div>
          )}

          {valueType === "indicator" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="indicator" className="block text-sm font-medium text-black mb-2">
                  Existing Indicator
                </Label>
                <Select value={indicator} onValueChange={setIndicator}>
                  <SelectTrigger id="indicator" className="w-full border border-gray-300 text-black bg-white">
                    <SelectValue placeholder="Select existing indicator" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {existingIndicatorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {renderExistingIndicatorParams()}
            </div>
          )}

          {valueType === "other" && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="indicator" className="block text-sm font-medium text-black mb-2">
                  Indicator Type
                </Label>
                <Select value={indicator} onValueChange={setIndicator}>
                  <SelectTrigger id="indicator" className="w-full border border-gray-300 text-black bg-white">
                    <SelectValue placeholder="Select indicator" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-black">
                    {/* Price Indicators */}
                    <SelectItem value="close">Close</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="price">Price</SelectItem>

                    {/* Technical Indicators */}
                    <SelectItem value="rsi">RSI</SelectItem>
                    <SelectItem value="rsi-ma">RSI-MA</SelectItem>
                    <SelectItem value="bollinger">Bollinger Bands</SelectItem>
                    <SelectItem value="macd">MACD</SelectItem>
                    <SelectItem value="sma">Simple Moving Average (SMA)</SelectItem>
                    <SelectItem value="stochastic">Stochastic</SelectItem>
                    <SelectItem value="atr">Average True Range (ATR)</SelectItem>

                    {/* Volume Indicators */}
                    <SelectItem value="volume">Volume</SelectItem>
                    <SelectItem value="volume-ma">Volume MA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeframe" className="block text-sm font-medium text-black mb-2">
                  Timeframe
                </Label>
                <div className="space-y-2">
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger id="timeframe" className="w-full border border-gray-300 text-black bg-white">
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                    <SelectContent className="bg-white text-black">
                      <SelectItem value="1min">1min</SelectItem>
                      <SelectItem value="5min">5min</SelectItem>
                      <SelectItem value="15min">15min</SelectItem>
                      <SelectItem value="30min">30min</SelectItem>
                      <SelectItem value="45min">45min</SelectItem>
                      <SelectItem value="1h">1h</SelectItem>
                      <SelectItem value="2h">2h</SelectItem>
                      <SelectItem value="3h">3h</SelectItem>
                      <SelectItem value="4h">4h</SelectItem>
                      <SelectItem value="6h">6h</SelectItem>
                      <SelectItem value="8h">8h</SelectItem>
                      <SelectItem value="12h">12h</SelectItem>
                      <SelectItem value="1d">1 day</SelectItem>
                      <SelectItem value="3d">3 days</SelectItem>
                      <SelectItem value="1w">1 week</SelectItem>
                      <SelectItem value="1M">1 month</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  {timeframe === "custom" && (
                    <Input
                      placeholder="Enter custom timeframe (e.g., 36min, 2.5h)"
                      value={customTimeframe}
                      onChange={(e) => setCustomTimeframe(e.target.value)}
                      className="w-full border border-gray-300 rounded-md text-black"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  onClick={() => {
                    onNext(indicator, timeframe === "custom" ? customTimeframe : timeframe)
                  }}
                  className="rounded-full px-6 bg-[#85e1fe] text-black hover:bg-[#6bc8e3] border-none"
                  disabled={!indicator || !timeframe || (timeframe === "custom" && !customTimeframe)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
          {valueType !== "other" && (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="rounded-full px-6 text-black border-gray-300 hover:bg-gray-100 hover:text-black"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="rounded-full px-6 bg-[#85e1fe] text-black hover:bg-[#6bc8e3] border-none"
              >
                Save
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
