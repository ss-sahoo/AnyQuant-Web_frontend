"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { DraggableModal } from "./draggable-modal"

interface VolumeSettingsModalProps {
  onClose: () => void
  onSave: (settings: any) => void
  initialIndicatorType?: "volume" | "volume-ma"
}

export function VolumeSettingsModal({ onClose, onSave, initialIndicatorType }: VolumeSettingsModalProps) {
  const [indicatorType, setIndicatorType] = useState<"volume" | "volume-ma">(initialIndicatorType || "volume")
  const [maLength, setMaLength] = useState("20")

  // Load saved Volume settings from localStorage on component mount
  useEffect(() => {
    try {
      const savedVolumeSettings = localStorage.getItem('volumeSettings');
      if (savedVolumeSettings) {
        const parsedSettings = JSON.parse(savedVolumeSettings);
        console.log('🔍 Loaded saved Volume settings:', parsedSettings);
        if (parsedSettings.maLength) {
          setMaLength(parsedSettings.maLength.toString());
        }
        // Use initialIndicatorType if provided, otherwise use saved settings
        if (initialIndicatorType) {
          setIndicatorType(initialIndicatorType);
        } else if (parsedSettings.indicatorType) {
          setIndicatorType(parsedSettings.indicatorType);
        }
      } else if (initialIndicatorType) {
        // If no saved settings but initialIndicatorType is provided, use it
        setIndicatorType(initialIndicatorType);
      }
    } catch (error) {
      console.log('Error reading saved Volume settings:', error);
    }
  }, [initialIndicatorType]);

  const handleSave = () => {
    // Save Volume settings to localStorage
    const volumeSettings = {
      indicatorType,
      maLength: Number(maLength),
    };
    
    try {
      localStorage.setItem('volumeSettings', JSON.stringify(volumeSettings));
      console.log('🔍 Saved Volume settings to localStorage:', volumeSettings);
    } catch (error) {
      console.log('Error saving Volume settings:', error);
    }
    
    onSave({
      indicatorType,
      maLength,
    })
  }

  return (
    <DraggableModal onClose={onClose} className="bg-[#f1f1f1] rounded-lg shadow-lg w-full max-w-md">
      <div>
        <div className="flex justify-between items-center p-6">
          <h2 className="text-2xl font-bold text-black">Volume Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 pb-6">
          <div className="mb-6">
            <label className="block text-lg font-medium text-gray-800 mb-2">Indicator Type</label>
            <div className="grid grid-cols-2 gap-0 border border-gray-300 rounded-md overflow-hidden">
              <button
                className={`py-3 px-4 text-center ${
                  indicatorType === "volume" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setIndicatorType("volume")}
              >
                Volume
              </button>
              <button
                className={`py-3 px-4 text-center ${
                  indicatorType === "volume-ma" ? "bg-gray-400 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setIndicatorType("volume-ma")}
              >
                Volume MA
              </button>
            </div>
          </div>

          <div className="border-t border-gray-300 my-6"></div>

          <div>
            <h3 className="text-xl font-medium text-gray-800 mb-4">Define Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-2">MA Length</label>
                <input
                  type="text"
                  value={maLength}
                  onChange={(e) => setMaLength(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded text-gray-700"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button onClick={handleSave} className="px-6 py-3 bg-[#85e1fe] rounded-full text-black hover:bg-[#6bcae2]">
              Save
            </button>
          </div>
        </div>
      </div>
    </DraggableModal>
  )
}
