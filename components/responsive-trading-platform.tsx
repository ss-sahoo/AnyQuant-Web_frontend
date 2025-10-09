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
  const [page, setPage] = useState(1)
const [totalCount, setTotalCount] = useState(0)
const pageSize = 10

const refreshAlgorithms = async (pageToFetch = page) => {
  setLoading(true)
  try {
    const { strategies, total } = await fetchStatement(pageToFetch, pageSize)

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
    refreshAlgorithms()
  }, [page])

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
    router.push("/strategy-builder")
  }

  return (
    <AuthGuard>
    <div className="flex min-h-screen bg-[#121420] text-white">
      <div className="hidden md:block">
        <Sidebar currentPage="home" />
      </div>

      <MobileSidebar currentPage="home" />

      <main className="flex-1 p-4 md:p-8 w-full">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4 md:gap-0">
            <h1 className="text-2xl md:text-3xl font-normal">Draft Algorithms</h1>
            <div className="flex flex-col sm:flex-row gap-3">
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
              onEdit={(id, name, instrument) => handleEditAlgorithm(id, name, instrument)}
              onDuplicate={(algorithm) => handleDuplicateAlgorithm(algorithm, false)}
              />
              {totalCount > pageSize && (
  <div className="flex justify-center items-center mt-6 gap-4">
    <Button
      onClick={() => {
        if (page > 1) {
          setPage((prev) => prev - 1)
          refreshAlgorithms(page - 1)
        }
      }}
      disabled={page === 1}
      variant="outline"
      className="text-[#6BCAE2] border-[#6BCAE2]"
    >
      Previous
    </Button>
    <span className="text-sm text-gray-300">Page {page}</span>
    <Button
      onClick={() => {
        if (page * pageSize < totalCount) {
          setPage((prev) => prev + 1)
          refreshAlgorithms(page + 1)
        }
      }}
      disabled={page * pageSize >= totalCount}
      className="bg-[#6BCAE2] text-black"
    >
      Next
    </Button>
  </div>
)}



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
