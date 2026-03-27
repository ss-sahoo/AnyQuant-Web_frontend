"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, User, LogOut, Menu, X, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getUserProfile } from "@/app/AllApiCalls"

// Helper to ensure image URL is absolute
const getAbsoluteImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null
  // If already absolute URL, return as is
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }
  // If relative URL, convert to absolute
  const baseUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://127.0.0.1:8000'
    : 'https://anyquant.co.uk'
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`
}

interface MobileSidebarProps {
  currentPage?: string
}

export function MobileSidebar({ currentPage = "home" }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    profile_image: null as string | null,
  })

  useEffect(() => {
    const fetchUserData = async () => {
      const userId = localStorage.getItem("user_id")
      if (userId) {
        try {
          const data = await getUserProfile(userId)
          setUserData({
            name: data.username || "User",
            email: data.email || "",
            profile_image: data.profile_image || null,
          })
        } catch (err) {
          console.error("Failed to load profile", err)
        }
      }
    }
    fetchUserData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user_id")
    router.push("/")
    setIsOpen(false)
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-md bg-[#2B2E38]"
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile sidebar overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setIsOpen(false)} />}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-[#141721] border-r border-gray-800 z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:hidden`}
      >
        <div className="flex flex-col h-full p-4">
          <div className="mb-8 flex justify-center">
            <Link href="/" onClick={() => setIsOpen(false)}>
              <div className="w-12 h-12 bg-[#6BCAE2] rounded-md flex items-center justify-center">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

          {/* User Profile Card */}
          <div className="bg-[#1E2132] rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 relative">
              {userData.profile_image ? (
                <>
                  <img
                    src={getAbsoluteImageUrl(userData.profile_image) || userData.profile_image}
                    alt="Profile"
                    className="w-12 h-12 rounded-full object-cover flex-shrink-0 border-2 border-[#6BCAE2]"
                    onError={(e) => {
                      // Hide image on error and show fallback
                      e.currentTarget.style.display = 'none'
                      const fallback = e.currentTarget.nextElementSibling as HTMLElement
                      if (fallback) {
                        fallback.style.display = 'flex'
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6BCAE2] to-[#5AB9D1] hidden items-center justify-center text-black font-semibold text-lg flex-shrink-0">
                    {userData.name.charAt(0).toUpperCase() || "U"}
                  </div>
                </>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#6BCAE2] to-[#5AB9D1] flex items-center justify-center text-black font-semibold text-lg flex-shrink-0">
                  {userData.name.charAt(0).toUpperCase() || "U"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{userData.name || "User"}</p>
                <p className="text-gray-400 text-xs truncate">{userData.email || "No email"}</p>
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-6 flex-1">
            <Link
              href="/home"
              className={cn(
                "flex items-center gap-3 transition-colors",
                currentPage === "home" ? "text-[#6BCAE2]" : "text-white hover:text-[#6BCAE2]",
              )}
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-6 h-6" />
              <span>Home</span>
            </Link>
            <Link
              href="/dashboard"
              className={cn(
                "flex items-center gap-3 transition-colors",
                currentPage === "dashboard" ? "text-[#6BCAE2]" : "text-white hover:text-[#6BCAE2]",
              )}
              onClick={() => setIsOpen(false)}
            >
              <BarChart2 className="w-6 h-6" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/profile"
              className={cn(
                "flex items-center gap-3 transition-colors",
                currentPage === "profile" ? "text-[#6BCAE2]" : "text-white hover:text-[#6BCAE2]",
              )}
              onClick={() => setIsOpen(false)}
            >
              <User className="w-6 h-6" />
              <span>Profile</span>
            </Link>
          </nav>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-500 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-6 h-6" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}
