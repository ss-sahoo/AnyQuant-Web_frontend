"use client"

import { useEffect, useState, useCallback } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { AlgorithmTable } from "@/components/algorithm-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { AlgorithmShortTable } from "@/components/algorithm-shorttable"
import { fetchStatement, editStrategy, deleteStatement, addToShortlist, removeFromShortlist, getShortlistedStrategies, duplicateStrategy, listCustomStrategies, getCustomStrategy, updateCustomStrategy, deleteCustomStrategy } from "@/app/AllApiCalls"
import { Search, X, Code } from "lucide-react"

import { useRouter } from "next/navigation"
import { mockAlgorithms, mockShortlistedAlgorithms } from "@/lib/mock-data"
import type { Algorithm } from "@/lib/types"
import { isCustomStrategyRow, type BuilderMode } from "@/lib/builder-mode"
import { BuilderModeChoiceModal } from "@/components/modals/builder-mode-choice-modal"
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
  const [showTypeDialog, setShowTypeDialog] = useState(false)

// When a Developer-Mode strategy is backtested, the backend creates a
// placeholder StrategyStatement to hang the BacktestResult off, with
// `strategy` set to a `{ custom_strategy_id }` marker instead of a condition
// list. It is not a no-code strategy: the same strategy is already listed from
// the custom-strategies API, `/strategy-builder/<id>` renders it as empty, and
// PATCHing it (rename) fails the backend validator, which indexes `strategy`
// as a list. Keep these rows out of the table.
const isCustomStrategyStub = (item: any) =>
  !!item?.strategy && !Array.isArray(item.strategy) && item.strategy.custom_strategy_id != null

// Epoch ms of a row's last edit, or 0 when the row carries no usable timestamp.
// The two list APIs are separate services and do not agree on a field name, so
// accept the usual aliases and fall back to creation time.
const lastEditedAt = (item: any): number => {
  const raw = item?.updated_at ?? item?.modified_at ?? item?.last_modified ?? item?.created_at
  const t = raw ? new Date(raw).getTime() : NaN
  return Number.isNaN(t) ? 0 : t
}

// The numeric id behind a display id (`12-3`, `12-dev-0`), used only to break
// ties between rows with no timestamp — a higher id means a later insert.
const rawId = (item: any): number => Number(String(item?.id ?? "").split("-")[0]) || 0

// Most recently edited first, so the list reflects what the user last worked on
// rather than which API a row came from. Rows the backend gave no timestamp for
// sink to the bottom, newest id first, instead of claiming the epoch.
const byLastEdited = (a: Algorithm, b: Algorithm): number => {
  const ta = lastEditedAt(a)
  const tb = lastEditedAt(b)
  if (ta && tb) return tb - ta
  if (ta || tb) return ta ? -1 : 1
  return rawId(b) - rawId(a)
}

const refreshAlgorithms = async (pageToFetch = page, search = searchQuery) => {
  setLoading(true)
  try {
    const { strategies, total } = await fetchStatement(pageToFetch, pageSize, search)

    // Regular strategies are always no-code; the type is fixed by which API the
    // row comes from and never changes (ANY-308).
    const regular = strategies.filter((item: any) => !isCustomStrategyStub(item))
    const mapped = regular.map((item: any, index: number): Algorithm => ({
      ...item,
      id: item.id ? `${item.id}-${index}` : `strategy-${index}`,
      name: item.name || item.saveresult || "Unnamed Strategy",
      instrument: item.instrument || "Unknown",
      type: "nocode",
    }))

    // Developer-mode (custom) strategies live in a separate unpaginated API
    // (ANY-308): show them on page 1, filtered by the same search string. The
    // `-dev-` display-id marker keeps row keys unique (custom and regular ids
    // collide numerically) while `id.split("-")[0]` still recovers the raw id.
    let devRows: Algorithm[] = []
    if (pageToFetch === 1) {
      try {
        const customs = await listCustomStrategies()
        const term = (search || "").toLowerCase()
        devRows = (Array.isArray(customs) ? customs : customs?.results || [])
          .filter((c: any) => !term || String(c.name || "").toLowerCase().includes(term))
          .map((c: any, i: number): Algorithm => ({
            ...c,
            id: `${c.id}-dev-${i}`,
            name: c.name || "Unnamed Strategy",
            instrument: "-",
            strategy: false,
            type: "developer",
          }))
      } catch (err) {
        // A failing custom endpoint must not blank the regular table.
        console.error("Error fetching custom strategies:", err)
      }
    }

    // Small delay to show loading state smoothly
    await new Promise(resolve => setTimeout(resolve, 100))

    setAlgorithms([...devRows, ...mapped].sort(byLastEdited))
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

    const mapped = response.results.filter((item: any) => !isCustomStrategyStub(item)).map((item: any, index: number): Algorithm => ({
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

  // Rows from the custom-strategies API carry a `-dev-` marker in their
  // display id (see refreshAlgorithms) and must hit the custom endpoints.
  const isDevRow = (id: string) => isCustomStrategyRow(id)

  const handleDeleteAlgorithm = async (id: string) => {
    try {
      const numericId = id.split("-")[0]
      if (isDevRow(id)) {
        await deleteCustomStrategy(Number(numericId))
      } else {
        await deleteStatement(numericId)
      }
      await refreshAlgorithms()
    } catch (err) {
      await refreshAlgorithms()
    }
  }

  const handleEditAlgorithm = async (id: string, name: string) => {
    try {
      const numericId = id.split("-")[0]

      if (isDevRow(id)) {
        // PUT replaces the record, so resend the code alongside the new name.
        const current = await getCustomStrategy(Number(numericId))
        await updateCustomStrategy(Number(numericId), {
          name: String(name),
          code: current.code || current.compiled_code || "",
        })
      } else {
        await editStrategy(numericId, { name: String(name) })
      }
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

  // A new strategy must not inherit the last one's id, or the builder reopens
  // that strategy instead of starting blank.
  const clearBuilderResidue = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('strategy_id')
        window.sessionStorage.removeItem('builder_saved')
      }
    } catch {}
  }

  // Type is fixed at creation and the two builders are different editors, so
  // Create Algorithm asks first rather than guessing (ANY-308). `mode` travels
  // in the URL, which also tells the builder the question is already answered.
  const handleCreateAlgorithm = () => setShowTypeDialog(true)

  const handleSelectNewStrategyType = (mode: BuilderMode) => {
    setShowTypeDialog(false)
    clearBuilderResidue()
    router.push(`/strategy-builder?mode=${mode}&new=1`)
  }

  // Standalone Developer Mode entry (ANY-308): build custom components and
  // code-based strategies without opening a no-code strategy first.
  const handleOpenDeveloperMode = () => {
    clearBuilderResidue()
    router.push("/strategy-builder?mode=developer&new=1")
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
                onClick={handleOpenDeveloperMode}
                variant="outline"
                className="border-[#6BCAE2] text-[#6BCAE2] hover:bg-[#6BCAE2]/10 hover:text-white w-full sm:w-auto"
              >
                <Code className="h-4 w-4 mr-2" />
                Developer Mode
              </Button>
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

      {showTypeDialog && (
        <BuilderModeChoiceModal
          title="What type of strategy?"
          description="This picks the editor you build in. A strategy's type is set at creation and can't be changed later."
          onClose={() => setShowTypeDialog(false)}
          onSelect={handleSelectNewStrategyType}
        />
      )}
    </div>
    </AuthGuard>
  )
}
