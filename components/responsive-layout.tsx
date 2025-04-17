"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { ResponsiveTable } from "@/components/responsive-table"
import { Button } from "@/components/ui/button"
import { mockAlgorithms, mockShortlistedAlgorithms } from "@/lib/mock-data"

export function ResponsiveLayout() {
  const [algorithms, setAlgorithms] = useState(mockAlgorithms)
  const [shortlistedAlgorithms, setShortlistedAlgorithms] = useState(mockShortlistedAlgorithms)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  const handleDeleteAlgorithm = (id: string, isShortlisted: boolean) => {
    if (isShortlisted) {
      setShortlistedAlgorithms(shortlistedAlgorithms.filter((algo) => algo.id !== id))
    } else {
      setAlgorithms(algorithms.filter((algo) => algo.id !== id))
    }
  }

  return (
    <div className="flex min-h-screen bg-[#121420] text-white">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar />

      <main className="flex-1 p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-normal">draft algorithms</h1>
            <Button className="bg-[#6BCAE2] hover:bg-[#5AB9D1] text-black rounded-full px-4 md:px-6 text-sm md:text-base">
              Create Algorithm
            </Button>
          </div>

          <ResponsiveTable algorithms={algorithms} onDelete={(id) => handleDeleteAlgorithm(id, false)} />

          <h1 className="text-2xl md:text-3xl font-normal mt-8 md:mt-12 mb-6 md:mb-8">shortlisted strategy variants</h1>

          <ResponsiveTable algorithms={shortlistedAlgorithms} onDelete={(id) => handleDeleteAlgorithm(id, true)} />
        </div>
      </main>
    </div>
  )
}
