"use client"

import { useEffect, useState, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { AlgorithmTable } from "@/components/algorithm-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { AlgorithmShortTable } from "@/components/algorithm-shorttable"
import { fetchStatement, editStrategy, deleteStatement } from "@/app/AllApiCalls"
import { Search, X } from "lucide-react"

import { useRouter } from "next/navigation"
import { mockAlgorithms, mockShortlistedAlgorithms } from "@/lib/mock-data"
import type { Algorithm } from "@/lib/types"
import AuthGuard from "@/hooks/useAuthGuard"

export function ResponsiveTradingPlatform() {
  const router = useRouter()
  const [algorithm, setAlgorithm] = useState(mockAlgorithms)
  const [shortlistedAlgorithms, setShortlistedAlgorithms] = useState(mockShortlistedAlgorithms)
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

const refreshAlgorithms = async (pageToFetch = page, search = searchQuery) => {
  setLoading(true)
  try {
    const { strategies, total } = await fetchStatement(pageToFetch, pageSize, search)

    const mapped = strategies.map((item, index) => ({
      ...item,
      id: item.id ? `${item.id}-${index}` : `strategy-${index}`,
      name: item.name || item.saveresult || "Unnamed Strategy",
      instrument: item.instrument || "Unknown",
    }))

    setAlgorithms(mapped)
    setTotalCount(total)
  } catch (err) {
    console.error("Error fetching:", err)
    setAlgorithms([])
  } finally {
    setLoading(false)
  }
}


  
  useEffect(() => {
    refreshAlgorithms(page, searchQuery)
  }, [page])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1) // Reset to first page on search
      refreshAlgorithms(1, searchQuery)
    }, 500) // 500ms debounce

    return () => clearTimeout(timer)
  }, [searchQuery])

  const handleSearchToggle = () => {
    setIsSearchOpen(!isSearchOpen)
    if (isSearchOpen) {
      setSearchQuery("") // Clear search when closing
    }
  }

  const handleDeleteAlgorithm = async (id: string) => {
    try {
      await deleteStatement(id.split("-")[0])
      await refreshAlgorithms()
    } catch (err) {
      await refreshAlgorithms()
    }
  }
  
  const handleEditAlgorithm = async (id: string, name: string) => {
    try {
      const numericId = id.split("-")[0]
  
      const payload = {
        name: String(name),
      }
  
  
      await editStrategy(numericId, payload)
      await refreshAlgorithms()
    } catch (err) {
      console.error("Edit failed:", err)
      alert("Edit failed.")
    }
  }
  
  
  
  
  const user_id = localStorage.getItem("user_id")


  const handleDuplicateAlgorithm = (duplicatedAlgorithm: Algorithm, isShortlisted: boolean) => {
    if (isShortlisted) {
      setShortlistedAlgorithms([...shortlistedAlgorithms, duplicatedAlgorithm])
    } else {
      setAlgorithm([...algorithm, duplicatedAlgorithm])
    }
  }

 
  const handleCreateAlgorithm = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('strategy_id')
        window.sessionStorage.removeItem('builder_saved')
      }
    } catch {}
    router.push("/strategy-builder?new=1")
  }

  return (
    <AuthGuard>
    <div className="flex min-h-screen bg-[#121420] text-white">
      <div className="hidden md:block">
        <Sidebar currentPage="home" />
      </div>

      <MobileSidebar currentPage="home" />

      <main className="flex-1 p-4 md:p-8 w-full md:ml-16">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 md:gap-0">
            <h1 className="text-2xl md:text-3xl font-normal">Draft Algorithms</h1>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              {isSearchOpen && (
                <div className="relative flex items-center">
                  <Input
                    type="text"
                    placeholder="Search strategies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#1a1d2e] border-[#6BCAE2] text-white placeholder:text-gray-400 pr-10 w-full sm:w-64"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSearchToggle}
                    className="absolute right-1 h-7 w-7 text-gray-400 hover:text-white hover:bg-transparent"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!isSearchOpen && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleSearchToggle}
                  className="border-[#6BCAE2] text-[#6BCAE2] hover:bg-[#6BCAE2]/10 hover:text-white"
                >
                  <Search className="h-4 w-4" />
                </Button>
              )}
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-[#6BCAE2] text-[#6BCAE2] hover:bg-[#6BCAE2]/10 hover:text-white w-full sm:w-auto"
                >
                  View Dashboard
                </Button>
              </Link>
              <Button
                onClick={handleCreateAlgorithm}
                className="bg-[#6BCAE2] hover:bg-[#5AB9D1] text-black rounded-full px-4 md:px-6 w-full sm:w-auto"
              >
                Create Algorithm
              </Button>
            </div>
          </div>

          <AlgorithmTable
              algorithms={algorithms}
              loading={loading}
              onDelete={handleDeleteAlgorithm}
              onEdit={(id, name) => handleEditAlgorithm(id, name)}
              onDuplicate={(algorithm) => handleDuplicateAlgorithm(algorithm, false)}
              />
              
              {/* Pagination Section */}
              <div className="mt-6 relative">
                {/* Left: Showing text */}
                <div className="text-xs text-gray-400 mb-4 md:mb-0 md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2">
                  {totalCount > 0 && (
                    <span>
                      Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} strategies
                    </span>
                  )}
                </div>

                {/* Center: Pagination buttons */}
                {totalCount > pageSize && (
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={() => {
                        if (page > 1) {
                          setPage((prev) => prev - 1)
                          refreshAlgorithms(page - 1)
                        }
                      }}
                      disabled={page === 1}
                      variant="outline"
                      className="text-[#6BCAE2] border-[#6BCAE2] hover:text-white hover:bg-[#6BCAE2]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-300">
                      Page {page} of {Math.ceil(totalCount / pageSize)}
                    </span>
                    <Button
                      onClick={() => {
                        if (page * pageSize < totalCount) {
                          setPage((prev) => prev + 1)
                          refreshAlgorithms(page + 1)
                        }
                      }}
                      disabled={page * pageSize >= totalCount}
                      className="bg-[#6BCAE2] text-black hover:bg-[#5AB9D1] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>



          <h1 className="text-2xl md:text-3xl font-normal mt-8 md:mt-12 mb-6 md:mb-8">shortlisted strategy variants</h1>

          <AlgorithmShortTable
            algorithm={shortlistedAlgorithms}
            onDelete={(id) => handleDeleteAlgorithm(id)}
            onDuplicate={(algorithm) => handleDuplicateAlgorithm(algorithm, true)}
            onEdit={(algorithm) => handleEditAlgorithm(algorithm.id, algorithm.name)}
          />
        </div>
      </main>
    </div>
    </AuthGuard>
  )
}
