"use client"

import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface ComponentsSidebarProps {
  onComponentSelect: (component: string) => void
}

export function ComponentsSidebar({ onComponentSelect }: ComponentsSidebarProps) {
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
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("If")}
            >
              If
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Unless")}
            >
              Unless
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Then")}
            >
              Then
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Timeframe")}
            >
              Timeframe
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Duration")}
            >
              Duration
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("When")}
            >
              When
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("At Candle")}
            >
              At Candle
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
            >
              Show all
            </Button>
          </div>
        </div>

        {/* Indicators */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium">Indicators</h3>
            <Button size="sm" variant="outline" className="h-8 px-3 bg-[#2B2E38] border-0 hover:bg-gray-700">
              Create
            </Button>
          </div>
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input className="pl-8 bg-[#2B2E38] border-0" placeholder="Search indicators" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("RSI")}
            >
              RSI
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Volume")}
            >
              Volume
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("MACD")}
            >
              MACD
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Bollinger")}
            >
              Bollinger
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Price")}
            >
              Price
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Stochastic")}
            >
              Stochastic
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
            >
              Show all
            </Button>
          </div>
        </div>

        {/* Behaviours */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <h3 className="font-medium mb-3">Behaviours</h3>
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input className="pl-8 bg-[#2B2E38] border-0" placeholder="Search behaviours" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Crossing up")}
            >
              Crossing up
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Crossing down")}
            >
              Crossing down
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Greater than")}
            >
              Greater than
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Less than")}
            >
              Less than
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Inside Channel")}
            >
              Inside Channel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-black text-gray-400 border-gray-700 hover:bg-gray-900 hover:text-white"
            >
              Show all
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <h3 className="font-medium mb-3">Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Long")}
            >
              Long
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Short")}
            >
              Short
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Wait")}
            >
              Wait
            </Button>
          </div>
        </div>

        {/* Trade Management */}
        <div className="mb-6 bg-black p-4 rounded-lg">
          <h3 className="font-medium mb-3">Trade Management</h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Manage")}
            >
              Manage
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Close")}
            >
              Close
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Cancel")}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("No Trade")}
            >
              No Trade
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2B2E38] border-0 hover:bg-gray-700"
              onClick={() => onComponentSelect("Reverse")}
            >
              Reverse
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
