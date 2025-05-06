"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, User, LogOut } from "lucide-react"
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
    <aside className="w-16 bg-[#141721] border-r border-gray-800 flex flex-col items-center py-6 h-screen fixed left-0 top-0 z-50">
      <div className="mb-8 flex items-center justify-center p-4">
        <Link href="/home">
          <div className="w-10 h-10 flex items-center justify-center">
            <img src="/images/logo.png" alt="Logo" className="w-full h-full" />
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
