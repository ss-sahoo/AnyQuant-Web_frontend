"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { StrategyBuilder } from "@/components/strategy-builder"
import { ComponentsSidebar } from "@/components/components-sidebar"

export default function StrategyBuilderPage() {
  const searchParams = useSearchParams()
  const [strategyName, setStrategyName] = useState("")
  const [instrument, setInstrument] = useState("")
  const [activeTab, setActiveTab] = useState("create")

  useEffect(() => {
    const name = searchParams.get("name")
    const inst = searchParams.get("instrument")

    if (name) setStrategyName(name)
    if (inst) setInstrument(inst)
  }, [searchParams])

  return (
    <div className="flex min-h-screen bg-[#000000] text-white">
      {/* Desktop sidebar - hidden on mobile */}
      <Sidebar currentPage="home" />

      {/* Mobile sidebar */}
      <MobileSidebar currentPage="home" />

      {/* Main content area */}
      <div className="flex flex-1 pl-16">
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex">
            <div
              className={`relative flex-1 py-3 text-center font-medium cursor-pointer ${
                activeTab === "create" ? "bg-[#c7c7c7] text-black" : "bg-[#9d9d9d] text-white"
              }`}
              onClick={() => setActiveTab("create")}
            >
              CREATE
              {activeTab === "create" && (
                <div className="absolute right-0 top-0 border-t-[24px] border-r-[24px] border-t-[#c7c7c7] border-r-transparent h-full"></div>
              )}
            </div>
            <div
              className={`flex-1 py-3 text-center font-medium cursor-pointer ${
                activeTab === "test" ? "bg-[#c7c7c7] text-black" : "bg-[#9d9d9d] text-white"
              }`}
              onClick={() => setActiveTab("test")}
            >
              TEST & OPTIMISE
            </div>
          </div>

          {/* Strategy builder */}
          <StrategyBuilder initialName={strategyName || "My Strategy"} initialInstrument={instrument || "XAU/USD"} />
        </div>

        {/* Components sidebar */}
        <ComponentsSidebar
          onComponentSelect={(component) => {
            // Get the active statement index from the strategy builder component
            const activeIndex =
              document.querySelector("[data-active-statement]")?.getAttribute("data-active-index") || "0"
            // Call the handleAddComponent function in the strategy builder
            const event = new CustomEvent("component-selected", {
              detail: { component, statementIndex: Number.parseInt(activeIndex, 10) },
            })
            document.dispatchEvent(event)
          }}
        />
      </div>
    </div>
  )
}
