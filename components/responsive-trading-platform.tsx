"use client"

import { useEffect, useState, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { AlgorithmTable } from "@/components/algorithm-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { AlgorithmShortTable } from "@/components/algorithm-shorttable"
import { fetchStatement, editStrategy, deleteStatement, addToShortlist, removeFromShortlist, getShortlistedStrategies, duplicateStrategy } from "@/app/AllApiCalls"
import { Search, X } from "lucide-react"

import { useRouter } from "next/navigation"
import { mockAlgorithms, mockShortlistedAlgorithms } from "@/lib/mock-data"
import type { Algorithm } from "@/lib/types"
import AuthGuard from "@/hooks/useAuthGuard"

export function ResponsiveTradingPlatform() {
  const router = useRouter()
  const [algorithm, setAlgorithm] = useState(mockAlgorithms)
  const [shortlistedAlgorithms, setShortlistedAlgorithms] = useState<Algorithm[]>([])
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([])
  const [loading, setLoading] = useState(true)
  const [shortlistLoading, setShortlistLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [shortlistPage, setShortlistPage] = useState(1)
  const [shortlistTotalCount, setShortlistTotalCount] = useState(0)
  const pageSize = 10
  const shortlistPageSize = 10
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchOpen, setIsSearchOpen] = useState(false)

const refreshAlgorithms = async (pageToFetch = page, search = searchQuery) => {
  setLoading(true)
  try {
    const { strategies, total } = await fetchStatement(pageToFetch, pageSize, search)

    const mapped = strategies.map((item: any, index: number): Algorithm => ({
      ...item,
      id: item.id ? `${item.id}-${index}` : `strategy-${index}`,
      name: item.name || item.saveresult || "Unnamed Strategy",
      instrument: item.instrument || "Unknown",
    }))

    // Small delay to show loading state smoothly
    await new Promise(resolve => setTimeout(resolve, 100))
    
    setAlgorithms(mapped)
    setTotalCount(total)
  } catch (err) {
    console.error("Error fetching:", err)
    setAlgorithms([])
  } finally {
    setLoading(false)
  }
}

const refreshShortlistedAlgorithms = async (pageToFetch = shortlistPage) => {
  setShortlistLoading(true)
  try {
    const response = await getShortlistedStrategies({ page: pageToFetch, page_size: shortlistPageSize })

    const mapped = response.results.map((item: any, index: number): Algorithm => ({
      ...item,
      id: item.id ? `${item.id}-${index}` : `strategy-${index}`,
      name: item.name || item.saveresult || "Unnamed Strategy",
      instrument: item.instrument || "Unknown",
      strategy: item.strategy || false,
    }))

    // Small delay to show loading state smoothly
    await new Promise(resolve => setTimeout(resolve, 100))
    
    setShortlistedAlgorithms(mapped)
    setShortlistTotalCount(response.count)
  } catch (err) {
    console.error("Error fetching shortlisted strategies:", err)
    setShortlistedAlgorithms([])
  } finally {
    setShortlistLoading(false)
  }
}


  
  useEffect(() => {
    refreshAlgorithms(page, searchQuery)
  }, [page])

  useEffect(() => {
    refreshShortlistedAlgorithms(shortlistPage)
  }, [shortlistPage])

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


  const handleDuplicateAlgorithm = async (name: string, instrument: string) => {
    // Refresh the algorithms list after successful duplication
    await refreshAlgorithms()
  }

  const handleAddToShortlist = async (id: string) => {
    try {
      const numericId = id.split("-")[0]
      await addToShortlist(numericId)
      // Refresh both lists
      await refreshAlgorithms()
      await refreshShortlistedAlgorithms()
    } catch (err) {
      console.error("Failed to add to shortlist:", err)
      alert("Failed to add strategy to shortlist")
    }
  }

  const handleRemoveFromShortlist = async (id: string) => {
    try {
      const numericId = id.split("-")[0]
      await removeFromShortlist(numericId)
      // Refresh both lists
      await refreshShortlistedAlgorithms()
      await refreshAlgorithms()
    } catch (err) {
      console.error("Failed to remove from shortlist:", err)
      alert("Failed to remove strategy from shortlist")
    }
  }

  const handleDuplicateShortlistedAlgorithm = async (name: string, instrument: string) => {
    // Refresh the shortlisted algorithms list after successful duplication
    await refreshShortlistedAlgorithms()
  }

  const handleEditShortlistedAlgorithm = async (id: string, name: string) => {
    try {
      const numericId = id.split("-")[0]
      const payload = { name: String(name) }
      await editStrategy(numericId, payload)
      await refreshShortlistedAlgorithms()
    } catch (err) {
      console.error("Edit failed:", err)
      alert("Edit failed.")
    }
  }

  const handleDeleteShortlistedAlgorithm = async (id: string) => {
    try {
      await deleteStatement(id.split("-")[0])
      await refreshShortlistedAlgorithms()
    } catch (err) {
      await refreshShortlistedAlgorithms()
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

          <div className="relative min-h-[400px]">
            {loading && algorithms.length > 0 && (
              <div className="absolute inset-0 bg-[#121420]/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                <div className="flex flex-col items-center gap-3">
                </div>
              </div>
            )}
            <AlgorithmTable
              algorithms={algorithms}
              loading={loading && algorithms.length === 0}
              onDelete={handleDeleteAlgorithm}
              onEdit={(id, name) => handleEditAlgorithm(id, name)}
              onDuplicate={handleDuplicateAlgorithm}
              onAddToShortlist={handleAddToShortlist}
            />
          </div>
              
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



          {/* Only show shortlisted section if there are shortlisted strategies or loading */}
          {(shortlistLoading || shortlistTotalCount > 0) && (
            <>
              <h1 className="text-2xl md:text-3xl font-normal mt-8 md:mt-12 mb-6 md:mb-8">shortlisted strategy variants</h1>

              <div className="relative min-h-[400px]">
                {shortlistLoading && shortlistedAlgorithms.length > 0 && (
                  <div className="absolute inset-0 bg-[#121420]/60 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                    
                    </div>
                  </div>
                )}
                <AlgorithmShortTable
                  algorithm={shortlistedAlgorithms}
                  loading={shortlistLoading && shortlistedAlgorithms.length === 0}
                  onDelete={handleDeleteShortlistedAlgorithm}
                  onDuplicate={handleDuplicateShortlistedAlgorithm}
                  onEdit={(algorithm) => handleEditShortlistedAlgorithm(algorithm.id, algorithm.name)}
                  onRemoveFromShortlist={handleRemoveFromShortlist}
                />
              </div>

              {/* Shortlist Pagination Section */}
              <div className="mt-6 relative">
                {/* Left: Showing text */}
                <div className="text-xs text-gray-400 mb-4 md:mb-0 md:absolute md:left-0 md:top-1/2 md:-translate-y-1/2">
                  {shortlistTotalCount > 0 && (
                    <span>
                      Showing {((shortlistPage - 1) * shortlistPageSize) + 1} to {Math.min(shortlistPage * shortlistPageSize, shortlistTotalCount)} of {shortlistTotalCount} shortlisted strategies
                    </span>
                  )}
                </div>

                {/* Center: Pagination buttons */}
                {shortlistTotalCount > shortlistPageSize && (
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      onClick={() => {
                        if (shortlistPage > 1) {
                          setShortlistPage((prev) => prev - 1)
                        }
                      }}
                      disabled={shortlistPage === 1}
                      variant="outline"
                      className="text-[#6BCAE2] border-[#6BCAE2] hover:text-white hover:bg-[#6BCAE2]/10 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-gray-300">
                      Page {shortlistPage} of {Math.ceil(shortlistTotalCount / shortlistPageSize)}
                    </span>
                    <Button
                      onClick={() => {
                        if (shortlistPage * shortlistPageSize < shortlistTotalCount) {
                          setShortlistPage((prev) => prev + 1)
                        }
                      }}
                      disabled={shortlistPage * shortlistPageSize >= shortlistTotalCount}
                      className="bg-[#6BCAE2] text-black hover:bg-[#5AB9D1] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
    </AuthGuard>
  )
}
