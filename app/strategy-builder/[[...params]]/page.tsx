"use client"

import { useState, useEffect } from "react"
import { useParams,useSearchParams } from "next/navigation"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { StrategyBuilder } from "@/components/strategy-builder"
import { ComponentsSidebar } from "@/components/components-sidebar"
import AuthGuard from "@/hooks/useAuthGuard"
import { fetchStatementDetail } from "@/app/AllApiCalls" 

export default function StrategyBuilderPage() {
  const params = useParams()
  const searchParams = useSearchParams()

  const [strategyData, setStrategyData] = useState<any>(null)
  const [strategyId, setStrategyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("create")
  const [error, setError] = useState<string | null>(null)
  const [strategyName, setStrategyName] = useState("")
  const [instrument, setInstrument] = useState("")

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

    if (name) setStrategyName(name)
    if (inst) setInstrument(inst)
    const id = params?.params?.[0];
   if(id){
      setStrategyId(id)
      fetchStrategyData(id)
   }
  }, [params,searchParams])

  

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-[#000000] text-white">
        <Sidebar currentPage="home" />
        <MobileSidebar currentPage="home" />

        <div className="flex flex-1 pl-16">
          <div className="flex-1 flex flex-col">
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

          
                <StrategyBuilder initialName={strategyName || ""} initialInstrument={instrument || "XAU/USD"} 
                strategyData={strategyData} strategyId={strategyId} />

          </div>

          <ComponentsSidebar
            onComponentSelect={(component) => {
              const activeIndex =
                document.querySelector("[data-active-statement]")?.getAttribute("data-active-index") || "0"
              const event = new CustomEvent("component-selected", {
                detail: { component, statementIndex: Number.parseInt(activeIndex, 10) },
              })
              document.dispatchEvent(event)
            }}
          />
        </div>
      </div>
    </AuthGuard>
  )
}
