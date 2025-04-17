"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, User, LogOut, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  currentPage?: string
}

export function Sidebar({ currentPage = "home" }: SidebarProps) {
  const router = useRouter()

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    router.push("/auth")
  }

  return (
    <aside className="w-16 bg-[#121420] border-r border-gray-800 flex flex-col items-center py-6">
      <div className="mb-8">
        <Link href="/home">
          <div className="w-10 h-10 bg-[#6BCAE2] rounded-md flex items-center justify-center">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        </Link>
      </div>

      <nav className="flex flex-col items-center gap-8 flex-1">
        <Link
          href="/home"
          className={cn(
            "flex flex-col items-center text-xs transition-colors",
            currentPage === "home" ? "text-[#6BCAE2]" : "text-white hover:text-[#6BCAE2]",
          )}
        >
          <Home className="w-6 h-6 mb-1" />
          <span>Home</span>
        </Link>
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center text-xs transition-colors",
            currentPage === "dashboard" ? "text-[#6BCAE2]" : "text-white hover:text-[#6BCAE2]",
          )}
        >
          <BarChart2 className="w-6 h-6 mb-1" />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/profile"
          className={cn(
            "flex flex-col items-center text-xs transition-colors",
            currentPage === "profile" ? "text-[#6BCAE2]" : "text-white hover:text-[#6BCAE2]",
          )}
        >
          <User className="w-6 h-6 mb-1" />
          <span>Profile</span>
        </Link>
      </nav>

      {/* 🔥 Logout Button */}
      <button
        onClick={handleLogout}
        className="flex flex-col items-center text-xs text-red-500 hover:text-red-400 transition-colors"
      >
        <LogOut className="w-6 h-6 mb-1" />
        <span>Logout</span>
      </button>
    </aside>
  )
}
