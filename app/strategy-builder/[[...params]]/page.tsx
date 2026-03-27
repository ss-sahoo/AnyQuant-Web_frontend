"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { StrategyBuilder } from "@/components/strategy-builder"
import { ComponentsSidebar } from "@/components/components-sidebar"
import AuthGuard from "@/hooks/useAuthGuard"
import { fetchStatementDetail } from "@/app/AllApiCalls"

export default function StrategyBuilderPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [strategyData, setStrategyData] = useState<any>(null)
  const [strategyId, setStrategyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("create")
  const [error, setError] = useState<string | null>(null)
  const [strategyName, setStrategyName] = useState("")
  const [instrument, setInstrument] = useState("")
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [isResizing, setIsResizing] = useState(false)

  const fetchStrategyData = async (id: string) => {
    try {

      const data = await fetchStatementDetail(id)
      setStrategyData(data)

    } catch (err: any) {
      setError("Failed to load strategy")

      console.error("Error fetching strategy:", err)
    }
  }

  useEffect(() => {
    const name = searchParams.get("name")
    const inst = searchParams.get("instrument")
    const isNew = searchParams.get("new") === '1' || searchParams.get('new') === 'true'

    if (name) setStrategyName(name)
    if (inst) setInstrument(inst)

    const id = params?.params?.[0];
    if (id) {
      setStrategyId(id)
      // Update localStorage immediately when opening a strategy from URL
      // This ensures saves use the correct ID from URL, not an old ID in localStorage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('strategy_id', id)
      }
      fetchStrategyData(id)
      return
    }

    // No id in URL: decide based on navigation intent and stored id
    try {
      const inBrowser = typeof window !== 'undefined'
      const shouldReturn = inBrowser && window.sessionStorage.getItem('builder_return') === '1'
      const storedId = inBrowser ? window.localStorage.getItem('strategy_id') : null

      if (shouldReturn && storedId) {
        // Returning from testing: show the last created/edited strategy even if ?new=1 is in history
        window.sessionStorage.removeItem('builder_return')
        setStrategyId(storedId)
        fetchStrategyData(storedId)
        try { router.replace(`/strategy-builder/${storedId}` as any) } catch { }
        return
      }

      if (isNew) {
        // Explicit create-new: clear any residue and start blank
        if (inBrowser) {
          window.localStorage.removeItem('strategy_id')
          window.sessionStorage.removeItem('builder_saved')
        }
        setStrategyId(null)
        setStrategyData(null)
        return
      }

      // Default: if a stored id exists, open it; else blank
      if (storedId) {
        setStrategyId(storedId)
        fetchStrategyData(storedId)
        try { router.replace(`/strategy-builder/${storedId}` as any) } catch { }
      } else {
        setStrategyId(null)
        setStrategyData(null)
      }
    } catch {
      // On any error, fall back to blank
      setStrategyId(null)
      setStrategyData(null)
    }
  }, [params, searchParams])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const newWidth = window.innerWidth - e.clientX
      // Set min and max limits
      if (newWidth >= 250 && newWidth <= 600) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])



  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#000000] text-white">
        <Sidebar currentPage="home" />
        <MobileSidebar currentPage="home" />

        <div className="flex flex-1 pl-16">
          <div className="flex-1 flex flex-col">
            <div className="flex">
              <div
                className={`relative flex-1 py-3 text-center font-medium cursor-pointer ${activeTab === "create" ? "bg-[#c7c7c7] text-black" : "bg-[#9d9d9d] text-white"
                  }`}
                onClick={() => setActiveTab("create")}
              >
                CREATE
                {activeTab === "create" && (
                  <div className="absolute right-0 top-0 border-t-[24px] border-r-[24px] border-t-[#c7c7c7] border-r-transparent h-full"></div>
                )}
              </div>
              <div
                className={`flex-1 py-3 text-center font-medium cursor-pointer ${activeTab === "test" ? "bg-[#c7c7c7] text-black" : "bg-[#9d9d9d] text-white"
                  }`}
                onClick={() => setActiveTab("test")}
              >
                TEST & OPTIMISE
              </div>
            </div>


            <StrategyBuilder initialName={strategyName || ""} initialInstrument={instrument || "XAU/USD"}
              strategyData={strategyData} strategyId={strategyId} />

          </div>

          {/* Resizer Handle */}
          <div
            className={`w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-20 ${isResizing ? "bg-blue-600 w-1.5" : "bg-gray-800"
              }`}
            onMouseDown={handleMouseDown}
          />

          <ComponentsSidebar
            width={sidebarWidth}
            onComponentSelect={(component, customComponentData) => {
              // Find the statement that has the active input field (focused search input)
              const activeInput = document.activeElement as HTMLInputElement
              let activeIndex = 0

              // Check if the active element is a search input field
              if (activeInput && activeInput.type === "text" && activeInput.placeholder?.includes("component name")) {
                // Find the parent statement container
                const statementContainer = activeInput.closest("[data-active-index]")
                if (statementContainer) {
                  const indexAttr = statementContainer.getAttribute("data-active-index")
                  if (indexAttr !== null) {
                    activeIndex = Number.parseInt(indexAttr, 10)
                  }
                }
              } else {
                // Fallback: use the statement with data-active-statement="true"
                const activeStatement = document.querySelector("[data-active-statement='true']")
                if (activeStatement) {
                  const indexAttr = activeStatement.getAttribute("data-active-index")
                  if (indexAttr !== null) {
                    activeIndex = Number.parseInt(indexAttr, 10)
                  }
                }
              }

              const event = new CustomEvent("component-selected", {
                detail: { component, statementIndex: activeIndex, customComponentData },
              })
              document.dispatchEvent(event)
            }}
            onEditCustomComponent={(component) => {
              // Dispatch event to open developer mode with component data for editing
              const event = new CustomEvent("edit-custom-component", {
                detail: component,
              })
              document.dispatchEvent(event)
            }}
          />
        </div>
      </div>
    </AuthGuard>
  )
}
