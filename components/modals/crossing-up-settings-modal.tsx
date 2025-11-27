"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"
import { RsiSettingsModal } from "@/components/modals/rsi-settings-modal"

interface CrossingUpSettingsModalProps {
  onClose: () => void
  currentInp1?: any 
  initialSettings?: {
    valueType?: string
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
  }
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
  onNext: (indicator: string, timeframe: string) => void
}

export function CrossingUpSettingsModal({ onClose, currentInp1, initialSettings, onSave, onNext }: CrossingUpSettingsModalProps) {
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
  const [bbSource, setBbSource] = useState("close")

  // Volume-MA parameters
  const [volumeMaLength, setVolumeMaLength] = useState(20)

  // Load saved Volume settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedVolumeSettings = localStorage.getItem('volumeSettings');
      if (savedVolumeSettings) {
        const parsedSettings = JSON.parse(savedVolumeSettings);
        console.log('🔍 Loaded saved Volume settings in crossing-up modal:', parsedSettings);
        if (parsedSettings.maLength) {
          setVolumeMaLength(parsedSettings.maLength);
          console.log('🔍 DEBUG: Set initial volumeMaLength to saved value:', parsedSettings.maLength);
        }
      }
    } catch (error) {
      console.log('Error reading saved Volume settings in crossing-up modal:', error);
    }
  }, []);

  // Additional indicator parameters
  const [fastPeriod, setFastPeriod] = useState(12)
  const [slowPeriod, setSlowPeriod] = useState(26)
  const [signalPeriod, setSignalPeriod] = useState(9)
  const [kPeriod, setKPeriod] = useState(14)
  const [dPeriod, setDPeriod] = useState(3)
  const [period, setPeriod] = useState(14)

  // Add state to control showing the indicator modal for 'other' valueType
  const [showIndicatorModal, setShowIndicatorModal] = useState(false)
  const [pendingOtherIndicator, setPendingOtherIndicator] = useState<string | null>(null)
  const [pendingTimeframe, setPendingTimeframe] = useState<string>("3h")

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
    } else if (currentInp1.name === "Stochastic") {
      options.push({ value: "stochastic", label: "Stochastic" })
    } else if (currentInp1.name === "Stochastic") {
      options.push({ value: "stochastic-oscillator", label: "Stochastic Oscillator" })
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

  // Initialize form fields from initialSettings when modal opens
  useEffect(() => {
    if (initialSettings) {
      console.log('🔍 DEBUG: Initializing form from initialSettings:', initialSettings);
      if (initialSettings.valueType) setValueType(initialSettings.valueType);
      if (initialSettings.customValue !== undefined) setCustomValue(String(initialSettings.customValue));
      if (initialSettings.indicator) setIndicator(initialSettings.indicator);
      if (initialSettings.timeframe) {
        // Check if timeframe is a custom value (not in standard list)
        const standardTimeframes = ["1min", "5min", "15min", "30min", "45min", "1h", "2h", "3h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"];
        if (standardTimeframes.includes(initialSettings.timeframe)) {
          setTimeframe(initialSettings.timeframe);
        } else {
          // It's a custom timeframe
          setTimeframe("custom");
          setCustomTimeframe(initialSettings.timeframe);
        }
      }
      if (initialSettings.band) setBand(initialSettings.band);
      if (initialSettings.timeperiod) setTimeperiod(initialSettings.timeperiod);
      if (initialSettings.rsiLength) setRsiLength(initialSettings.rsiLength);
      if (initialSettings.rsiMaLength) setRsiMaLength(initialSettings.rsiMaLength);
      if (initialSettings.maLength) setMaLength(initialSettings.maLength);
      if (initialSettings.rsiSource) setRsiSource(initialSettings.rsiSource);
      if (initialSettings.maType) setMaType(initialSettings.maType);
      if (initialSettings.bbStdDev !== undefined) setBbStdDev(initialSettings.bbStdDev);
      if (initialSettings.bbSource) setBbSource(initialSettings.bbSource);
      if (initialSettings.volumeMaLength) setVolumeMaLength(initialSettings.volumeMaLength);
      if (initialSettings.fastPeriod) setFastPeriod(initialSettings.fastPeriod);
      if (initialSettings.slowPeriod) setSlowPeriod(initialSettings.slowPeriod);
      if (initialSettings.signalPeriod) setSignalPeriod(initialSettings.signalPeriod);
      if (initialSettings.kPeriod) setKPeriod(initialSettings.kPeriod);
      if (initialSettings.dPeriod) setDPeriod(initialSettings.dPeriod);
      if (initialSettings.period) setPeriod(initialSettings.period);
    }
  }, [initialSettings]);

  // Initialize parameters based on current inp1
  // Skip this if initialSettings is provided (editing existing settings)
  useEffect(() => {
    if (initialSettings) {
      // If we have initialSettings, don't initialize from currentInp1
      // as initialSettings represents the actual saved state
      return;
    }
    console.log('🔍 DEBUG: useEffect triggered with currentInp1:', currentInp1);
    if (currentInp1) {
      if (currentInp1.name === "RSI") {
        setRsiLength(currentInp1.input_params?.timeperiod || 14)
        setRsiMaLength(currentInp1.input_params?.timeperiod || 14)
        setMaLength(currentInp1.input_params?.ma_length || 14)
        setRsiSource(currentInp1.input_params?.source || "Close")
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
        console.log('🔍 DEBUG: Found Volume_MA in currentInp1:', currentInp1);
        console.log('🔍 DEBUG: Volume_MA input_params:', currentInp1.input_params);
        
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
  }, [currentInp1, initialSettings])

  const handleSave = () => {
    console.log('🔍 handleSave called with indicator:', indicator, 'valueType:', valueType);
    console.log('🔍 currentInp1:', currentInp1);
    console.log('🔍 DEBUG: maType value before save:', maType);
    console.log('🔍 DEBUG: volumeMaLength value before save:', volumeMaLength);
    
    // For RSI_MA indicator, use saved localStorage values instead of currentInp1
    if (valueType === "indicator" && indicator === "rsi-ma") {
      // Get saved RSI settings from localStorage
      let savedRsiSettings = null;
      try {
        const savedSettings = localStorage.getItem('rsiSettings');
        console.log('🔍 Retrieved saved RSI settings in handleSave:', savedSettings);
        if (savedSettings) {
          savedRsiSettings = JSON.parse(savedSettings);
          console.log('🔍 Parsed saved RSI settings:', savedRsiSettings);
        }
      } catch (error) {
        console.log('Error reading saved RSI settings in handleSave:', error);
      }
      
      // Use saved values with fallbacks
      const finalRsiMaLength = savedRsiSettings?.rsiLength || 14;
      const finalMaLength = savedRsiSettings?.maLength || 14;
      const finalRsiSource = savedRsiSettings?.source || "Close";
      const finalMaType = savedRsiSettings?.maType || "SMA";
      const finalBbStdDev = savedRsiSettings?.bbStdDev || 2;
      
      console.log('🔧 Final values for RSI_MA in handleSave:', {
        rsiMaLength: finalRsiMaLength,
        maLength: finalMaLength,
        rsiSource: finalRsiSource,
        maType: finalMaType,
        bbStdDev: finalBbStdDev
      });
      
      onSave({
        valueType,
        indicator,
        timeframe: timeframe === "custom" ? customTimeframe : timeframe,
        rsiMaLength: finalRsiMaLength,
        maLength: finalMaLength,
        rsiSource: finalRsiSource,
        maType: finalMaType,
        bbStdDev: finalBbStdDev,
      });
      return;
    }
    
    // For other indicators, use the form values
    let finalRsiMaLength = rsiMaLength
    let finalMaLength = maLength
    
    // Create the save object without maType for Volume_MA
    const saveObject: any = {
      valueType,
      customValue,
      indicator,
      timeframe: timeframe === "custom" ? customTimeframe : timeframe,
      band,
      timeperiod,
      rsiLength,
      rsiMaLength: finalRsiMaLength,
      maLength: finalMaLength,
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
    
    console.log('🔍 DEBUG: Save object before maType check:', saveObject);
    console.log('🔍 DEBUG: indicator value:', indicator);
    console.log('🔍 DEBUG: indicator !== "volume-ma":', indicator !== "volume-ma");
    
    // Only include maType if it's not Volume_MA and maType is not empty
    if (indicator !== "volume-ma" && maType && maType.trim() !== "") {
      saveObject.maType = maType
      console.log('🔍 DEBUG: Added maType to save object:', maType);
    } else {
      console.log('🔍 DEBUG: Skipped adding maType for Volume_MA or empty maType');
    }
    
    console.log('🔍 DEBUG: Final save object:', saveObject);
    
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

  // Add a helper to get read-only parameter values for existing indicators
  const getReadOnlyParams = (): {
    rsiLength?: number;
    rsiSource?: string;
    maLength?: number;
    maType?: string;
    bbStdDev?: number;
    volumeMaLength?: number;
  } => {
    if (!currentInp1) return {}
    if (indicator === "rsi") {
      // If inp1 is RSI, use its timeperiod. If inp1 is RSI_MA, use its rsi_length.
      let rsiLength = 14;
      let rsiSource = "close";
      
      // Try to get saved RSI settings from localStorage first
      try {
        const savedRsiSettings = localStorage.getItem('rsiSettings');
        console.log('🔍 Raw localStorage data for rsiSettings:', savedRsiSettings);
        if (savedRsiSettings) {
          const parsedSettings = JSON.parse(savedRsiSettings);
          console.log('📖 Parsed RSI settings:', parsedSettings);
          // For RSI, use rsiLength if available, otherwise fall back to defaults
          rsiLength = parsedSettings.rsiLength || 14;
          rsiSource = parsedSettings.source || "close";
          console.log('📖 Retrieved saved RSI settings for RSI - rsiLength:', rsiLength, 'rsiSource:', rsiSource);
        } else {
          console.log('📖 No saved RSI settings found in localStorage');
        }
      } catch (error) {
        console.log('Error reading saved RSI settings:', error);
      }
      
      if (currentInp1.name === "RSI") {
        rsiLength = currentInp1.input_params?.timeperiod || rsiLength;
        rsiSource = currentInp1.input_params?.source || rsiSource;
      } else if (currentInp1.name === "RSI_MA") {
        rsiLength = currentInp1.input_params?.rsi_length || rsiLength;
        rsiSource = currentInp1.input_params?.rsi_source || rsiSource;
      }
      return {
        rsiLength,
        rsiSource,
      }
    } else if (indicator === "rsi-ma") {
      // For RSI_MA, get all parameters including MA values
      let rsiLength = 14;
      let rsiSource = "Close";
      let maLength = 14;
      let maType = "SMA";
      let bbStdDev = 2;
      
      // Try to get saved RSI settings from localStorage first
      try {
        const savedRsiSettings = localStorage.getItem('rsiSettings');
        if (savedRsiSettings) {
          const parsedSettings = JSON.parse(savedRsiSettings);
          rsiLength = parsedSettings.rsiLength || 14;
          rsiSource = parsedSettings.source || "Close";
          maLength = parsedSettings.maLength || 14;
          maType = parsedSettings.maType || "SMA";
          bbStdDev = parsedSettings.bbStdDev || 2;
          console.log('📖 Retrieved saved RSI settings for RSI_MA:', parsedSettings);
        }
      } catch (error) {
        console.log('Error reading saved RSI settings:', error);
      }
      
      if (currentInp1.name === "RSI_MA") {
        rsiLength = currentInp1.input_params?.rsi_length || rsiLength;
        rsiSource = currentInp1.input_params?.rsi_source || rsiSource;
        maLength = currentInp1.input_params?.ma_length || maLength;
        maType = currentInp1.input_params?.ma_type || maType;
        bbStdDev = currentInp1.input_params?.bb_stddev || bbStdDev;
      } else if (currentInp1.name === "RSI") {
        rsiLength = currentInp1.input_params?.timeperiod || rsiLength;
        rsiSource = currentInp1.input_params?.source || rsiSource;
        // For RSI, use saved MA values from localStorage
      }
      return {
        rsiLength,
        rsiSource,
        maLength,
        maType,
        bbStdDev,
      }
    } else if (indicator === "volume-ma") {
      // Get saved Volume settings from localStorage
      let savedVolumeMaLength = 20;
      try {
        const savedVolumeSettings = localStorage.getItem('volumeSettings');
        if (savedVolumeSettings) {
          const parsedSettings = JSON.parse(savedVolumeSettings);
          savedVolumeMaLength = parsedSettings.maLength || 20;
          console.log('🔍 DEBUG: Using saved Volume settings in getReadOnlyParams:', parsedSettings);
        }
      } catch (error) {
        console.log('Error reading saved Volume settings in getReadOnlyParams:', error);
      }
      
      return {
        volumeMaLength: currentInp1.input_params?.ma_length || savedVolumeMaLength,
      }
    } else if (["open", "high", "low", "close"].includes(indicator)) {
      return {}
    } else if (indicator === "volume") {
      return {}
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
    if (indicator === "stochastic" || indicator === "stochastic-oscillator") {
      return (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Stochastic parameters will use the same settings as the original indicator.
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

  const handleCrossingUpNext = (indicator: string, timeframe: string) => {
    onNext(indicator, timeframe)
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] bg-white p-0 border border-gray-200 shadow-lg rounded-lg overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <DialogTitle className="text-lg font-medium text-black">Crossing Above Settings</DialogTitle>
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

      {showIndicatorModal && pendingOtherIndicator === "rsi" && (
        <RsiSettingsModal
          onClose={() => setShowIndicatorModal(false)}
          onSave={(settings: any) => {
            setShowIndicatorModal(false)
            onSave({
              valueType: "other",
              indicator: "rsi",
              timeframe: pendingTimeframe,
              rsiLength: settings.rsiLength,
              rsiSource: settings.source,
              maType: settings.maType,
              maLength: settings.maLength,
              bbStdDev: settings.bbStdDev,
            })
          }}
        />
      )}
      {showIndicatorModal && pendingOtherIndicator === "rsi-ma" && (
        <RsiSettingsModal
          onClose={() => setShowIndicatorModal(false)}
          onSave={(settings: any) => {
            setShowIndicatorModal(false)
            onSave({
              valueType: "other",
              indicator: "rsi-ma",
              timeframe: pendingTimeframe,
              rsiLength: settings.rsiLength,
              maLength: settings.maLength,
              rsiSource: settings.source,
              maType: settings.maType,
              bbStdDev: settings.bbStdDev,
            })
          }}
        />
      )}
    </Dialog>
  )
}
