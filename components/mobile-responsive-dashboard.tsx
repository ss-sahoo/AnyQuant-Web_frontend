"use client"

import { useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { AlgorithmTable } from "@/components/algorithm-table"
import { ChartView } from "@/components/chart-view"
import { AccountsSection } from "@/components/accounts-section"
import { mockAlgorithms } from "@/lib/mock-data"
import { Link, Menu } from "lucide-react"

export function MobileResponsiveDashboard() {
  const [algorithms, setAlgorithms] = useState(mockAlgorithms)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const handleDeleteAlgorithm = (id: string) => {
    setAlgorithms(algorithms.filter((algo) => algo.id !== id))
  }

  return (
    <div className="min-h-screen bg-[#121420] text-white">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center p-4 border-b border-gray-800">
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 mr-2">
          <Menu className="w-6 h-6" />
        </button>
        <div className="w-8 h-8 bg-[#6BCAE2] rounded-md flex items-center justify-center mr-2">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#121420" />
            <path d="M2 17L12 22L22 17" stroke="#121420" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="#121420" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-lg font-medium">AnyQuant</h1>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#121420] border-r border-gray-800 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
      >
        <div className="p-4 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-[#6BCAE2] rounded-md flex items-center justify-center mr-2">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#121420" />
                <path
                  d="M2 17L12 22L22 17"
                  stroke="#121420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M2 12L12 17L22 12"
                  stroke="#121420"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-lg font-medium">AnyQuant</h1>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2">
            &times;
          </button>
        </div>
        <div className="p-4">
          <nav className="space-y-4">
            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-800">
              Home
            </a>
            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-800">
              Profile
            </a>
            <a href="#" className="block py-2 px-4 rounded hover:bg-gray-800 text-red-500">
              Logout
            </a>
          </nav>
        </div>
      </div>

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 w-full">
          <div className="max-w-7xl mx-auto">
            {/* Chart Section */}
            <div className="mb-6">
              <ChartView />
            </div>

            {/* Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Draft Algorithms Section */}
              <div className="lg:col-span-2 order-2 lg:order-1">
                <div className="flex justify-between items-center mb-4">
                  {/* <h1 className="text-xl md:text-2xl font-normal">Draft algorithms</h1> */}
                 <Link href="/strategy-builder">
                 <button className="bg-[#6BCAE2] hover:bg-[#5AB9D1] text-black rounded-full px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm">
                    Create Strategy
                  </button>
                 </Link>
                </div>

                <AlgorithmTable algorithms={algorithms} onDelete={handleDeleteAlgorithm} />
              </div>

              {/* Accounts Section */}
              <div className="lg:col-span-1 order-1 lg:order-2">
                <AccountsSection />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
