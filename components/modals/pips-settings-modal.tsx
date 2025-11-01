"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface PipsSettingsModalProps {
  initialValue?: number
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
    // Volume-MA parameters
    volumeMaLength?: number
    fastPeriod?: number
    slowPeriod?: number
    signalPeriod?: number
    kPeriod?: number
    dPeriod?: number
    period?: number
  }) => void
}

export function PipsSettingsModal({ initialValue = 500, onClose, currentInp1, onSave }: PipsSettingsModalProps) {
  const [valueType, setValueType] = useState("value")
  const [customValue, setCustomValue] = useState(initialValue.toString())
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
  const [bbSource, setBbSource] = useState("close")

  // Volume-MA parameters
  const [volumeMaLength, setVolumeMaLength] = useState(20)

  // Load saved Volume settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedVolumeSettings = localStorage.getItem('volumeSettings');
      if (savedVolumeSettings) {
        const parsedSettings = JSON.parse(savedVolumeSettings);
        console.log('🔍 Loaded saved Volume settings in pips modal:', parsedSettings);
        if (parsedSettings.maLength) {
          setVolumeMaLength(parsedSettings.maLength);
        }
      }
    } catch (error) {
      console.log('Error reading saved Volume settings in pips modal:', error);
    }
  }, []);

  // Additional indicator parameters
  const [fastPeriod, setFastPeriod] = useState(12)
  const [slowPeriod, setSlowPeriod] = useState(26)
  const [signalPeriod, setSignalPeriod] = useState(9)
  const [kPeriod, setKPeriod] = useState(14)
  const [dPeriod, setDPeriod] = useState(3)
  const [period, setPeriod] = useState(14)

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
      // Add OHLC options for BBANDS
      options.push({ value: "high", label: "High" })
      options.push({ value: "low", label: "Low" })
      options.push({ value: "mid", label: "Mid" })
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
        // Get saved Volume settings as fallback
        let savedVolumeMaLength = 20;
        try {
          const savedVolumeSettings = localStorage.getItem('volumeSettings');
          if (savedVolumeSettings) {
            const parsedSettings = JSON.parse(savedVolumeSettings);
            savedVolumeMaLength = parsedSettings.maLength || 20;
          }
        } catch (error) {
          console.log('Error reading saved Volume settings:', error);
        }
        
        // Always use saved settings for Volume_MA, unless currentInp1 has a specific ma_length
        let finalVolumeMaLength = savedVolumeMaLength;
        if (currentInp1.input_params?.ma_length) {
          finalVolumeMaLength = currentInp1.input_params.ma_length;
        }
        console.log('🔍 DEBUG: Setting Volume_MA length to:', finalVolumeMaLength, '(saved:', savedVolumeMaLength, ', current:', currentInp1.input_params?.ma_length, ')');
        setVolumeMaLength(finalVolumeMaLength)
        // Volume_MA should never have maType, so explicitly clear it
        setMaType("")
        if (valueType === "indicator" || valueType === "other") {
          setIndicator("volume-ma")
        }
      } else {
        // For any other indicators, don't set maType to avoid contamination
        // Only RSI and RSI_MA should have maType
      }

      if (currentInp1.timeframe) {
        setTimeframe(currentInp1.timeframe)
      }
    }
  }, [currentInp1])

  const handleSave = () => {
    // Create the save object without maType for Volume_MA
    const saveObject: any = {
      valueType,
      customValue,
      indicator,
      timeframe: timeframe === "custom" ? customTimeframe : timeframe,
      band,
      timeperiod,
      rsiLength,
      rsiMaLength,
      maLength,
      rsiSource,
      bbStdDev,
      bbSource,
      volumeMaLength,
      fastPeriod,
      slowPeriod,
      signalPeriod,
      kPeriod,
      dPeriod,
      period,
    }
    
    // Only include maType if it's not Volume_MA and maType is not empty
    if (indicator !== "volume-ma" && maType && maType.trim() !== "") {
      saveObject.maType = maType
    }
    
    // Save Volume settings to localStorage if Volume_MA is being used
    if (indicator === "volume-ma" && volumeMaLength) {
      try {
        const volumeSettings = {
          indicatorType: "volume-ma",
          maLength: volumeMaLength,
        };
        localStorage.setItem('volumeSettings', JSON.stringify(volumeSettings));
        console.log('🔍 Saved Volume settings to localStorage:', volumeSettings);
      } catch (error) {
        console.log('Error saving Volume settings:', error);
      }
    }
    
    onSave(saveObject)
  }

  const renderExistingIndicatorParams = () => {
    if (valueType !== "indicator" || !indicator) return null

    if (indicator === "rsi") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="rsiLength" className="block text-sm font-medium text-black mb-2">
              RSI Length
            </Label>
            <Input
              id="rsiLength"
              value={rsiLength}
              onChange={(e) => setRsiLength(Number(e.target.value))}
              type="number"
              className="w-full border border-gray-300 rounded-md text-black"
            />
          </div>
          <div>
            <Label htmlFor="rsiSource" className="block text-sm font-medium text-black mb-2">
              RSI Source
            </Label>
            <Select value={rsiSource} onValueChange={setRsiSource}>
              <SelectTrigger id="rsiSource" className="w-full border border-gray-300 text-black bg-white">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="Close">Close</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )
    }

    if (indicator === "rsi-ma") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="rsiMaLength" className="block text-sm font-medium text-black mb-2">
              RSI Length
            </Label>
            <Input
              id="rsiMaLength"
              value={rsiMaLength}
              onChange={(e) => setRsiMaLength(Number(e.target.value))}
              type="number"
              className="w-full border border-gray-300 rounded-md text-black"
            />
          </div>
          <div>
            <Label htmlFor="maLength" className="block text-sm font-medium text-black mb-2">
              MA Length
            </Label>
            <Input
              id="maLength"
              value={maLength}
              onChange={(e) => setMaLength(Number(e.target.value))}
              type="number"
              className="w-full border border-gray-300 rounded-md text-black"
            />
          </div>
          <div>
            <Label htmlFor="rsiSource" className="block text-sm font-medium text-black mb-2">
              RSI Source
            </Label>
            <Select value={rsiSource} onValueChange={setRsiSource}>
              <SelectTrigger id="rsiSource" className="w-full border border-gray-300 text-black bg-white">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="Close">Close</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="maType" className="block text-sm font-medium text-black mb-2">
              MA Type
            </Label>
            <Select value={maType} onValueChange={setMaType}>
              <SelectTrigger id="maType" className="w-full border border-gray-300 text-black bg-white">
                <SelectValue placeholder="Select MA type" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="SMA">SMA</SelectItem>
                <SelectItem value="EMA">EMA</SelectItem>
                <SelectItem value="WMA">WMA</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="bbStdDev" className="block text-sm font-medium text-black mb-2">
              BB Std Dev
            </Label>
            <Input
              id="bbStdDev"
              value={bbStdDev}
              onChange={(e) => setBbStdDev(Number(e.target.value))}
              type="number"
              step="0.1"
              className="w-full border border-gray-300 rounded-md text-black"
            />
          </div>
        </div>
      )
    }

    // Add Volume-MA parameters
    if (indicator === "volume-ma") {
      return (
        <div className="space-y-4">
          <div>
            <Label htmlFor="volumeMaLength" className="block text-sm font-medium text-black mb-2">
              MA Length
            </Label>
            <Input
              id="volumeMaLength"
              value={volumeMaLength}
              onChange={(e) => setVolumeMaLength(Number(e.target.value))}
              type="number"
              className="w-full border border-gray-300 rounded-md text-black"
            />
          </div>
        </div>
      )
    }

    // For OHLC price indicators, no additional parameters needed
    if (["open", "high", "low", "close"].includes(indicator)) {
      return (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            No additional parameters required for {indicator.charAt(0).toUpperCase() + indicator.slice(1)} price.
          </div>
        </div>
      )
    }

    // For regular Volume, no additional parameters needed
    if (indicator === "volume") {
      return (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">No additional parameters required for Volume.</div>
        </div>
      )
    }

    return null
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] bg-white p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
      <DialogTitle className="text-lg font-medium text-black">Points Settings</DialogTitle>
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
                Points Value
              </Label>
              <Input
                id="customValue"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                type="number"
                className="w-full border border-gray-300 rounded-md text-black"
                placeholder="Enter points value"
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

              {/* Comprehensive Parameter Configuration */}
              {indicator &&
                indicator !== "close" &&
                indicator !== "open" &&
                indicator !== "high" &&
                indicator !== "low" &&
                indicator !== "price" &&
                indicator !== "volume" && (
                  <div className="space-y-4 border-t pt-4">
                    <h4 className="text-sm font-medium text-black">Indicator Parameters</h4>

                    {/* RSI Parameters */}
                    {indicator === "rsi" && (
                  <div className="space-y-3">
                <div>
                  <Label htmlFor="rsiPeriod" className="block text-sm font-medium text-black mb-2">
                    RSI Period
                  </Label>
                  <Input
                    id="rsiPeriod"
                    value={rsiLength}
                    onChange={(e) => setRsiLength(Number(e.target.value))}
                    type="number"
                    className="w-full border border-gray-300 rounded-md text-black"
                  />
                </div>
                <div>
            <Label htmlFor="rsiSource" className="block text-sm font-medium text-black mb-2">
              RSI Source
            </Label>
            <Select value={rsiSource} onValueChange={setRsiSource}>
              <SelectTrigger id="rsiSource" className="w-full border border-gray-300 text-black bg-white">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent className="bg-white text-black">
                <SelectItem value="Close">Close</SelectItem>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
                </div>
                

              )}

                    {/* RSI-MA Parameters */}
                    {indicator === "rsi-ma" && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="rsiMaLength" className="block text-sm font-medium text-black mb-2">
                            RSI Length
                          </Label>
                          <Input
                            id="rsiMaLength"
                            value={rsiMaLength}
                            onChange={(e) => setRsiMaLength(Number(e.target.value))}
                            type="number"
                            className="w-full border border-gray-300 rounded-md text-black"
                          />
                        </div>
                        <div>
                          <Label htmlFor="maLength" className="block text-sm font-medium text-black mb-2">
                            MA Length
                          </Label>
                          <Input
                            id="maLength"
                            value={maLength}
                            onChange={(e) => setMaLength(Number(e.target.value))}
                            type="number"
                            className="w-full border border-gray-300 rounded-md text-black"
                          />
                        </div>
                        <div>
                          <Label htmlFor="rsiSource" className="block text-sm font-medium text-black mb-2">
                            RSI Source
                          </Label>
                          <Select value={rsiSource} onValueChange={setRsiSource}>
                            <SelectTrigger className="w-full border border-gray-300 text-black bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white text-black">
                              <SelectItem value="Close">Close</SelectItem>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="maType" className="block text-sm font-medium text-black mb-2">
                            MA Type
                          </Label>
                          <Select value={maType} onValueChange={setMaType}>
                            <SelectTrigger className="w-full border border-gray-300 text-black bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white text-black">
                              <SelectItem value="SMA">SMA</SelectItem>
                              <SelectItem value="EMA">EMA</SelectItem>
                              <SelectItem value="WMA">WMA</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Bollinger Bands Parameters */}
                    {indicator === "bollinger" && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="band" className="block text-sm font-medium text-black mb-2">
                            Band
                          </Label>
                          <Select value={band} onValueChange={setBand}>
                            <SelectTrigger className="w-full border border-gray-300 text-black bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white text-black">
                              <SelectItem value="upperband">Upper Band</SelectItem>
                              <SelectItem value="middleband">Middle Band</SelectItem>
                              <SelectItem value="lowerband">Lower Band</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="timeperiod" className="block text-sm font-medium text-black mb-2">
                            Time Period
                          </Label>
                          <Input
                            id="timeperiod"
                            value={timeperiod}
                            onChange={(e) => setTimeperiod(Number(e.target.value))}
                            type="number"
                            className="w-full border border-gray-300 rounded-md text-black"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bbStdDev" className="block text-sm font-medium text-black mb-2">
                            Standard Deviation
                          </Label>
                          <Input
                            id="bbStdDev"
                            value={bbStdDev}
                            onChange={(e) => setBbStdDev(Number(e.target.value))}
                            type="number"
                            step="0.1"
                            className="w-full border border-gray-300 rounded-md text-black"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bbSource" className="block text-sm font-medium text-black mb-2">
                            Source
                          </Label>
                          <Select value={bbSource} onValueChange={setBbSource}>
                            <SelectTrigger className="w-full border border-gray-300 text-black bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white text-black">
                              <SelectItem value="close">Close</SelectItem>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="hl2">HL2</SelectItem>
                              <SelectItem value="hlc3">HLC3</SelectItem>
                              <SelectItem value="ohlc4">OHLC4</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}

                    {/* Volume MA Parameters */}
                    {indicator === "volume-ma" && (
                      <div>
                        <Label htmlFor="volumeMaLength" className="block text-sm font-medium text-black mb-2">
                          MA Length
                        </Label>
                        <Input
                          id="volumeMaLength"
                          value={volumeMaLength}
                          onChange={(e) => setVolumeMaLength(Number(e.target.value))}
                          type="number"
                          className="w-full border border-gray-300 rounded-md text-black"
                        />
                      </div>
                    )}

                    {/* Moving Average Parameters */}
                    {(indicator === "sma" || indicator === "ema" || indicator === "wma") && (
                      <div>
                        <Label htmlFor="maLength" className="block text-sm font-medium text-black mb-2">
                          Period
                        </Label>
                        <Input
                          id="maLength"
                          value={maLength}
                          onChange={(e) => setMaLength(Number(e.target.value))}
                          type="number"
                          className="w-full border border-gray-300 rounded-md text-black"
                        />
                      </div>
                    )}

                    {/* MACD Parameters */}
                    {indicator === "macd" && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="fastPeriod" className="block text-sm font-medium text-black mb-2">
                            Fast Period
                          </Label>
                          <Input
                            id="fastPeriod"
                            value={fastPeriod}
                            onChange={(e) => setFastPeriod(Number(e.target.value))}
                            type="number"
                            className="w-full border border-gray-300 rounded-md text-black"
                          />
                        </div>
                        <div>
                          <Label htmlFor="slowPeriod" className="block text-sm font-medium text-black mb-2">
                            Slow Period
                          </Label>
                          <Input
                            id="slowPeriod"
                            value={slowPeriod}
                            onChange={(e) => setSlowPeriod(Number(e.target.value))}
                            type="number"
                            className="w-full border border-gray-300 rounded-md text-black"
                          />
                        </div>
                        <div>
                          <Label htmlFor="signalPeriod" className="block text-sm font-medium text-black mb-2">
                            Signal Period
                          </Label>
                          <Input
                            id="signalPeriod"
                            value={signalPeriod}
                            onChange={(e) => setSignalPeriod(Number(e.target.value))}
                            type="number"
                            className="w-full border border-gray-300 rounded-md text-black"
                          />
                        </div>
                      </div>
                    )}

                    {indicator === "stochastic" && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="kPeriod" className="block text-sm font-medium text-black mb-2">
                            %K Period
                          </Label>
                          <Input
                            id="kPeriod"
                            value={kPeriod}
                            onChange={(e) => setKPeriod(Number(e.target.value))}
                            type="number"
                            className="w-full border border-gray-300 rounded-md text-black"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dPeriod" className="block text-sm font-medium text-black mb-2">
                            %D Period
                          </Label>
                          <Input
                            id="dPeriod"
                            value={dPeriod}
                            onChange={(e) => setDPeriod(Number(e.target.value))}
                            type="number"
                            className="w-full border border-gray-300 rounded-md text-black"
                          />
                        </div>
                      </div>
                    )}

                    {/* Generic Period Parameter for other indicators */}
                    {["williams-r", "cci", "atr", "adx", "momentum", "roc"].includes(indicator) && (
                      <div>
                        <Label htmlFor="period" className="block text-sm font-medium text-black mb-2">
                          Period
                        </Label>
                        <Input
                          id="period"
                          value={period}
                          onChange={(e) => setPeriod(Number(e.target.value))}
                          type="number"
                          className="w-full border border-gray-300 rounded-md text-black"
                        />
                      </div>
                    )}
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 bg-gray-50">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
