"use client"

import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { AlgorithmTable } from "@/components/algorithm-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { AlgorithmShortTable } from "@/components/algorithm-shorttable"
import { fetchStatement, editStrategy, deleteStatement } from "@/app/AllApiCalls"


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

  const refreshAlgorithms = async () => {
    setLoading(true)
    try {
      const data = await fetchStatement()
      const sortedData = data
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10)
      const mapped = sortedData.map((item, index) => ({
        ...item,
        id: item.id ? `${item.id}-${index}` : `strategy-${index}`,
        name: item.name || item.saveresult || "Unnamed Strategy",
        instrument: item.instrument || "Unknown",
      }))
      setAlgorithms(mapped)
    } catch (err) {
      console.error("Error fetching:", err)
      setAlgorithms([])
    } finally {
      setLoading(false)
    }
  }
  console.log("Fetched algorithms:", algorithms)

  
  useEffect(() => {
    refreshAlgorithms()
  }, [])

  const handleDeleteAlgorithm = async (id: string) => {
    try {
      await deleteStatement(id.split("-")[0])
      await refreshAlgorithms()
    } catch (err) {
      await refreshAlgorithms()
    }
  }
  
  const handleEditAlgorithm = async (id: string, name: string, instrument: string) => {
    try {
      const numericId = id.split("-")[0]
  
      const payload = {
        name: String(name),
        instrument: String(instrument),
      }
  
      console.log("Sending payload to editStrategy:", payload)
  
      await editStrategy(numericId, payload)
      await refreshAlgorithms()
    } catch (err) {
      console.error("Edit failed:", err)
      alert("Edit failed.")
    }
  }
  
  
  
  
  const user_id = localStorage.getItem("user_id")
  console.log("user id ", user_id)
  // const handleDeleteAlgorithm = (id: string, isShortlisted: boolean) => {
  //   if (isShortlisted) {
  //     setShortlistedAlgorithms(shortlistedAlgorithms.filter((algo) => algo.id !== id))
  //   } else {
  //     setAlgorithm(algorithm.filter((algo) => algo.id !== id))
  //   }
  // }

  const handleDuplicateAlgorithm = (duplicatedAlgorithm: Algorithm, isShortlisted: boolean) => {
    if (isShortlisted) {
      setShortlistedAlgorithms([...shortlistedAlgorithms, duplicatedAlgorithm])
    } else {
      setAlgorithm([...algorithm, duplicatedAlgorithm])
    }
  }

  // const handleEditAlgorithm = (updatedAlgorithm: Algorithm, isShortlisted: boolean) => {
  //   if (isShortlisted) {
  //     setShortlistedAlgorithms(
  //       shortlistedAlgorithms.map((algo) => (algo.id === updatedAlgorithm.id ? updatedAlgorithm : algo)),
  //     )
  //   } else {
  //     setAlgorithm(algorithm.map((algo) => (algo.id === updatedAlgorithm.id ? updatedAlgorithm : algo)))
  //   }
  // }
  const handleCreateAlgorithm = () => {
    router.push("/strategy-builder")
  }

  return (
    <AuthGuard>
    <div className="flex min-h-screen bg-[#121420] text-white">
      {/* Desktop sidebar - hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar currentPage="home" />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar currentPage="home" />

      <main className="flex-1 p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 md:gap-0">
            <h1 className="text-2xl md:text-3xl font-normal">Draft Algorithms</h1>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="border-[#6BCAE2] text-[#6BCAE2] hover:bg-[#6BCAE2]/10 w-full sm:w-auto"
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
              onEdit={(id, name, instrument) => handleEditAlgorithm(id, name, instrument)}
              onDuplicate={(algorithm) => handleDuplicateAlgorithm(algorithm, false)}
              />


          <h1 className="text-2xl md:text-3xl font-normal mt-8 md:mt-12 mb-6 md:mb-8">shortlisted strategy variants</h1>

          <AlgorithmShortTable
            algorithm={shortlistedAlgorithms}
            onDelete={(id) => handleDeleteAlgorithm(id, true)}
            onDuplicate={(algorithm) => handleDuplicateAlgorithm(algorithm, true)}
            onEdit={(algorithm) => handleEditAlgorithm(algorithm, true)}
          />
        </div>
      </main>
    </div>
    </AuthGuard>
  )
}
