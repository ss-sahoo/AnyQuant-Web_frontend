"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { StrategyBuilder } from "@/components/strategy-builder"

export default function StrategyBuilderPage() {
  const searchParams = useSearchParams()
  const [strategyName, setStrategyName] = useState("")
  const [instrument, setInstrument] = useState("")

  useEffect(() => {
    const name = searchParams.get("name")
    const inst = searchParams.get("instrument")

    if (name) setStrategyName(name)
    if (inst) setInstrument(inst)
  }, [searchParams])

  return (
    <div className="flex min-h-screen bg-[#121420] text-white">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar currentPage="home" />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar currentPage="home" />

      <main className="flex-1 w-full">
        <StrategyBuilder initialName={strategyName} initialInstrument={instrument || "XAU/USD"} />
      </main>
    </div>
  )
}
