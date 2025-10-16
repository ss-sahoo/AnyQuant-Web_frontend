"use client"

import { useState } from "react"
import { X, Plus, Trash2 } from "lucide-react"

interface SLTPSettingsModalProps {
  type: "SL" | "TP"
  onClose: () => void
  onSave: (settings: SLTPSettings) => void
  initialSettings?: Partial<SLTPSettings>
}

// Add a new "close" option to the valueType in the interface
export interface SLTPSettings {
  type: "SL" | "TP" | "partial_tp"
  valueType: "pips" | "percentage" | "fixed" | "indicator" | "close"
  direction: "+" | "-" | "*"
  value: string
  useAdvanced: boolean
  inp1?: string
  inp2?: string
  trailingStop?: boolean
  trailingStep?: string
  indicatorParams?: {
    name?: string
    side?: string
    timeframe?: string
    nperiod?: number
    [key: string]: any
  }
  partialTpList?: Array<{
    Price: string
    Close: string
    Action?: string
    name?: string
    operator?: string
  }>
  formatType?: "simple" | "advanced" | "trailing" | "indicator" | "partial" | "fixed"
}

export function SLTPSettingsModal({ type, onClose, onSave, initialSettings }: SLTPSettingsModalProps) {
  const [settings, setSettings] = useState<SLTPSettings>({
    type,
    valueType: initialSettings?.valueType || "pips",
    direction: initialSettings?.direction || (type === "SL" ? "-" : "+"),
    value: initialSettings?.value || (type === "SL" ? "900" : "1500"),
    useAdvanced: initialSettings?.useAdvanced || false,
    trailingStop: initialSettings?.trailingStop || false,
    trailingStep: initialSettings?.trailingStep || "0",
    inp2: initialSettings?.inp2 || "Entry_Price",
    partialTpList: initialSettings?.partialTpList || (type === "TP" ? [{ Price: "Entry_Price + 200pips", Close: "50%" }] : undefined),
  })

  const [formatType, setFormatType] = useState<"simple" | "advanced" | "trailing" | "indicator" | "partial" | "fixed">(
    initialSettings?.formatType || "simple",
  )

  const handleSave = () => {
    // Set useAdvanced based on format type
    const updatedSettings = {
      ...settings,
      useAdvanced: formatType !== "simple" && formatType !== "fixed",
      trailingStop: formatType === "trailing",
      formatType: formatType, // Add the formatType to the settings
      // Set type to "partial_tp" when formatType is "partial"
      type: formatType === "partial" ? "partial_tp" : settings.type,
    }
    onSave(updatedSettings)
    onClose()
  }

  const addPartialTpLevel = () => {
    if (!settings.partialTpList) {
      setSettings({
        ...settings,
        partialTpList: [{ Price: "Entry_Price + 200pips", Close: "50%" }],
      })
    } else {
      setSettings({
        ...settings,
        partialTpList: [
          ...settings.partialTpList,
          { Price: `Entry_Price + ${Number(settings.value) * 0.5}pips`, Close: "25%" },
        ],
      })
    }
  }

  const updatePartialTpLevel = (index: number, field: keyof (typeof settings.partialTpList)[0], value: string) => {
    if (settings.partialTpList) {
      const newList = [...settings.partialTpList]
      newList[index] = { ...newList[index], [field]: value }
      setSettings({ ...settings, partialTpList: newList })
    }
  }

  const removePartialTpLevel = (index: number) => {
    if (settings.partialTpList && settings.partialTpList.length > 1) {
      const newList = settings.partialTpList.filter((_, i) => i !== index)
      setSettings({ ...settings, partialTpList: newList })
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-medium">
            {type === "SL" ? "Stop Loss" : type === "TP" ? "Take Profit" : "Partial Take Profit"} Settings
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Format</label>
            <div className="flex flex-wrap gap-2">
              <button
                className={`px-3 py-1 rounded-md ${
                  formatType === "simple" ? "bg-blue-600 text-white" : "bg-gray-100 text-black hover:bg-gray-200"
                }`}
                onClick={() => setFormatType("simple")}
              >
                Simple
              </button>
              <button
                className={`px-3 py-1 rounded-md ${
                  formatType === "advanced" ? "bg-blue-600 text-white" : "bg-gray-100 text-black hover:bg-gray-200"
                }`}
                onClick={() => setFormatType("advanced")}
              >
                Advanced
              </button>
              <button
                className={`px-3 py-1 rounded-md ${
                  formatType === "trailing" ? "bg-blue-600 text-white" : "bg-gray-100 text-black hover:bg-gray-200"
                }`}
                onClick={() => setFormatType("trailing")}
              >
                Trailing
              </button>
              <button
                className={`px-3 py-1 rounded-md ${
                  formatType === "indicator" ? "bg-blue-600 text-white" : "bg-gray-100 text-black hover:bg-gray-200"
                }`}
                onClick={() => setFormatType("indicator")}
              >
                Indicator
              </button>
              <button
                className={`px-3 py-1 rounded-md ${
                  formatType === "fixed" ? "bg-blue-600 text-white" : "bg-gray-100 text-black hover:bg-gray-200"
                }`}
                onClick={() => setFormatType("fixed")}
              >
                Fixed Price
              </button>
              {type === "TP" && (
                <button
                  className={`px-3 py-1 rounded-md ${
                    formatType === "partial" ? "bg-blue-600 text-white" : "bg-gray-100 text-black hover:bg-gray-200"
                  }`}
                  onClick={() => setFormatType("partial")}
                >
                  Partial TP
                </button>
              )}
            </div>
          </div>

          {formatType === "simple" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Value Type</label>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.valueType === "pips"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                    onClick={() => setSettings({ ...settings, valueType: "pips" })}
                  >
                    Pips
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.valueType === "percentage"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        valueType: "percentage",
                        direction: "*",
                      })
                    }
                  >
                    Percentage
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.valueType === "close"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                    onClick={() =>
                      setSettings({
                        ...settings,
                        valueType: "close",
                        direction: "*",
                      })
                    }
                  >
                    Close Price
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Direction</label>
                <div className="flex gap-2">
                  {settings.valueType === "pips" ? (
                    <>
                      <button
                        className={`px-3 py-1 rounded-md ${
                          settings.direction === "+"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-black hover:bg-gray-200"
                        }`}
                        onClick={() => setSettings({ ...settings, direction: "+" })}
                      >
                        +
                      </button>
                      <button
                        className={`px-3 py-1 rounded-md ${
                          settings.direction === "-"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-black hover:bg-gray-200"
                        }`}
                        onClick={() => setSettings({ ...settings, direction: "-" })}
                      >
                        -
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        className={`px-3 py-1 rounded-md ${
                          settings.direction === "*"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-black hover:bg-gray-200"
                        }`}
                        onClick={() => setSettings({ ...settings, direction: "*" })}
                      >
                        ×
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <input
                  type="text"
                  value={settings.value}
                  onChange={(e) => setSettings({ ...settings, value: e.target.value })}
                  className="w-full bg-gray-100 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={settings.valueType === "percentage" ? "e.g. 1.10 for +10%, 0.90 for -10%" : ""}
                />
                {settings.valueType === "percentage" && (
                  <p className="text-xs text-gray-400 mt-1">
                    Enter a multiplier. For example, 1.10 for a 10% increase, or 0.90 for a 10% decrease.
                  </p>
                )}
              </div>
              {settings.valueType === "close" && (
                <div>
                  <label className="block text-sm font-medium mb-1">Multiplier</label>
                  <input
                    type="text"
                    value={settings.value}
                    onChange={(e) => setSettings({ ...settings, value: e.target.value })}
                    className="w-full bg-gray-100 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. 1.02 for SL, 0.96 for TP"
                  />
                  <p className="text-xs text-gray-400 mt-1">{settings.type} will be set to Close * multiplier</p>
                </div>
              )}
            </>
          )}

          {formatType === "advanced" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Input 1 (Target)</label>
                <input
                  type="text"
                  value={settings.inp1 || settings.type}
                  onChange={(e) => setSettings({ ...settings, inp1: e.target.value })}
                  className="w-full bg-gray-100 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reference Type</label>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.inp2 === "Entry_Price"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                    onClick={() => setSettings({ ...settings, inp2: "Entry_Price" })}
                  >
                    Entry Price
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.inp2 === "Close" ? "bg-blue-600 text-white" : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                    onClick={() => setSettings({ ...settings, inp2: "Close" })}
                  >
                    Close Price
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Operation</label>
                <div className="flex gap-2">
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.direction === "+" ? "bg-blue-600 text-white" : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                    onClick={() => setSettings({ ...settings, direction: "+" })}
                  >
                    +
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.direction === "-" ? "bg-blue-600 text-white" : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                    onClick={() => setSettings({ ...settings, direction: "-" })}
                  >
                    -
                  </button>
                  <button
                    className={`px-3 py-1 rounded-md ${
                      settings.direction === "*" ? "bg-blue-600 text-white" : "bg-gray-100 text-black hover:bg-gray-200"
                    }`}
                    onClick={() => setSettings({ ...settings, direction: "*" })}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Value</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={settings.value}
                    onChange={(e) => setSettings({ ...settings, value: e.target.value })}
                    className="w-full bg-gray-100 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2">pips</span>
                </div>
              </div>
            </>
          )}

          {formatType === "trailing" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Base Price</label>
                <div className="flex gap-2 mb-3">
                  <button className={`px-3 py-1 rounded-md bg-blue-600 text-white`} onClick={() => {}}>
                    Entry Price
                  </button>
                </div>

                <div className="flex items-center mb-3">
                  <label className="block text-sm font-medium mr-2">Direction</label>
                  <div className="flex gap-2">
                    <button
                      className={`px-3 py-1 rounded-md ${
                        settings.direction === "+"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-black hover:bg-gray-200"
                      }`}
                      onClick={() => setSettings({ ...settings, direction: "+" })}
                    >
                      +
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md ${
                        settings.direction === "-"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-black hover:bg-gray-200"
                      }`}
                      onClick={() => setSettings({ ...settings, direction: "-" })}
                    >
                      -
                    </button>
                  </div>
                </div>

                <div className="flex items-center mb-3">
                  <label className="block text-sm font-medium mr-2">Initial Distance</label>
                  <input
                    type="text"
                    value={settings.value}
                    onChange={(e) => setSettings({ ...settings, value: e.target.value })}
                    className="w-24 bg-gray-100 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2">pips</span>
                </div>

                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="useTrailingStep"
                      checked={!!settings.trailingStep && settings.trailingStep !== "0"}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSettings({ ...settings, trailingStep: "250" })
                        } else {
                          setSettings({ ...settings, trailingStep: undefined })
                        }
                      }}
                      className="mr-2"
                    />
                    <label htmlFor="useTrailingStep" className="text-sm font-medium">
                      Use Trailing Step
                    </label>
                  </div>

                  {!!settings.trailingStep && settings.trailingStep !== "0" && (
                    <div className="flex items-center">
                      <label className="block text-sm font-medium mr-2">Trailing Step</label>
                      <input
                        type="text"
                        value={settings.trailingStep}
                        onChange={(e) => setSettings({ ...settings, trailingStep: e.target.value })}
                        className="w-24 bg-gray-100 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2">pips</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {formatType === "indicator" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Indicator Type</label>
                <select
                  className="w-full bg-gray-100 border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                  value={settings.indicatorParams?.name || "nperiod_hl"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      indicatorParams: {
                        ...settings.indicatorParams,
                        name: e.target.value,
                      },
                    })
                  }
                >
                  <option value="nperiod_hl">N-Period High/Low</option>
                  <option value="ma">Moving Average</option>
                  <option value="atr">ATR</option>
                </select>
              </div>

              {settings.indicatorParams?.name === "nperiod_hl" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Side</label>
                    <div className="flex gap-2">
                      <button
                        className={`px-3 py-1 rounded-md ${
                          (settings.indicatorParams?.side || "low") === "low"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-black hover:bg-gray-200"
                        }`}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            indicatorParams: {
                              ...settings.indicatorParams,
                              side: "low",
                            },
                          })
                        }
                      >
                        Low
                      </button>
                      <button
                        className={`px-3 py-1 rounded-md ${
                          (settings.indicatorParams?.side || "low") === "high"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-black hover:bg-gray-200"
                        }`}
                        onClick={() =>
                          setSettings({
                            ...settings,
                            indicatorParams: {
                              ...settings.indicatorParams,
                              side: "high",
                            },
                          })
                        }
                      >
                        High
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Period</label>
                    <input
                      type="number"
                      value={settings.indicatorParams?.nperiod || 30}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          indicatorParams: {
                            ...settings.indicatorParams,
                            nperiod: Number.parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full bg-gray-100 border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Timeframe</label>
                <select
                  className="w-full bg-gray-100 border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                  value={settings.indicatorParams?.timeframe || "1h"}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      indicatorParams: {
                        ...settings.indicatorParams,
                        timeframe: e.target.value,
                      },
                    })
                  }
                >
                  <option value="15min">15 min</option>
                  <option value="30min">30 min</option>
                  <option value="1h">1 hour</option>
                  <option value="4h">4 hours</option>
                  <option value="1 day">1 day</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Adjustment</label>
                <div className="flex items-center">
                  <div className="flex gap-2 mr-2">
                    <button
                      className={`px-3 py-1 rounded-md ${
                        settings.direction === "+"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-black hover:bg-gray-200"
                      }`}
                      onClick={() => setSettings({ ...settings, direction: "+" })}
                    >
                      +
                    </button>
                    <button
                      className={`px-3 py-1 rounded-md ${
                        settings.direction === "-"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-black hover:bg-gray-200"
                      }`}
                      onClick={() => setSettings({ ...settings, direction: "-" })}
                    >
                      -
                    </button>
                  </div>
                  <input
                    type="text"
                    value={settings.value}
                    onChange={(e) => setSettings({ ...settings, value: e.target.value })}
                    className="w-24 bg-gray-100 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="ml-2">pips</span>
                </div>
              </div>
            </>
          )}

          {formatType === "fixed" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Fixed Price Value</label>
                <input
                  type="text"
                  value={settings.value}
                  onChange={(e) => setSettings({ ...settings, value: e.target.value, valueType: "fixed" })}
                  className="w-full bg-gray-100 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}

          {formatType === "partial" && type === "TP" && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Partial Take Profit Levels</label>
                {settings.partialTpList?.map((level, index) => (
                  <div key={index} className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Level {index + 1}</span>
                      <button onClick={() => removePartialTpLevel(index)} className="text-red-400 hover:text-red-300">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="mb-2">
                      <label className="block text-xs mb-1">Type</label>
                      <div className="flex gap-2">
                        <button
                          className={`px-3 py-1 rounded-md text-xs ${
                            !level.name ? "bg-blue-600 text-white" : "bg-gray-100 text-black"
                          }`}
                          onClick={() => {
                            const newList = [...settings.partialTpList!]
                            // Remove name and operator if they exist
                            const { name, operator, ...rest } = newList[index]
                            // Add Price if it doesn't exist
                            newList[index] = {
                              ...rest,
                              Price: rest.Price || "Entry_Price + 200pips",
                            }
                            setSettings({ ...settings, partialTpList: newList })
                          }}
                        >
                          Price-based
                        </button>
                        <button
                          className={`px-3 py-1 rounded-md text-xs ${
                            level.name === "Equity" ? "bg-blue-600 text-white" : "bg-gray-100 text-black"
                          }`}
                          onClick={() => {
                            const newList = [...settings.partialTpList!]
                            // Add name and operator
                            newList[index] = {
                              ...newList[index],
                              name: "Equity",
                              operator: newList[index].operator || "moving_up 300pips",
                            }
                            // Remove Price if it exists
                            delete newList[index].Price
                            setSettings({ ...settings, partialTpList: newList })
                          }}
                        >
                          Equity-based
                        </button>
                      </div>
                    </div>

                    {!level.name ? (
                      <div className="mb-2">
                        <label className="block text-xs mb-1">Price</label>
                        <input
                          type="text"
                          value={level.Price || ""}
                          onChange={(e) => updatePartialTpLevel(index, "Price", e.target.value)}
                          className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                          placeholder="Entry_Price + 200pips"
                        />
                      </div>
                    ) : (
                      <div className="mb-2">
                        <label className="block text-xs mb-1">Condition</label>
                        <input
                          type="text"
                          value={level.operator || ""}
                          onChange={(e) => updatePartialTpLevel(index, "operator", e.target.value)}
                          className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                          placeholder="moving_up 300pips"
                        />
                      </div>
                    )}

                    <div className="mb-2">
                      <label className="block text-xs mb-1">Close Percentage</label>
                      <input
                        type="text"
                        value={level.Close}
                        onChange={(e) => updatePartialTpLevel(index, "Close", e.target.value)}
                        className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                        placeholder="50%"
                      />
                    </div>

                    <div>
                      <label className="block text-xs mb-1">Action (Optional)</label>
                      <input
                        type="text"
                        value={level.Action || ""}
                        onChange={(e) => updatePartialTpLevel(index, "Action", e.target.value)}
                        className="w-full bg-white border border-gray-300 px-3 py-2 rounded-md focus:outline-none"
                        placeholder="SL = Entry_Price"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={addPartialTpLevel}
                  className="flex items-center justify-center w-full py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
                >
                  <Plus size={16} className="mr-1" /> Add Level
                </button>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 rounded-md hover:bg-blue-700">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
