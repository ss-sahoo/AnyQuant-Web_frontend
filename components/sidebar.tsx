"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"
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

interface SidebarProps {
  currentPage?: string
}

export function Sidebar({ currentPage = "home" }: SidebarProps) {
  const router = useRouter()
  const [showProfileTooltip, setShowProfileTooltip] = useState(false)
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
        <div 
          className="relative group"
          onMouseEnter={() => setShowProfileTooltip(true)}
          onMouseLeave={() => setShowProfileTooltip(false)}
        >
          {/* Always visible user avatar - clickable */}
          <Link href="/profile" className="flex flex-col items-center text-xs cursor-pointer relative">
            {userData.profile_image ? (
              <>
                <img
                  src={getAbsoluteImageUrl(userData.profile_image) || userData.profile_image}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover mb-1 hover:scale-105 transition-transform border-2 border-[#6BCAE2]"
                  onError={(e) => {
                    // Hide image on error and show fallback
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement
                    if (fallback) {
                      fallback.style.display = 'flex'
                    }
                  }}
                />
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6BCAE2] to-[#5AB9D1] hidden items-center justify-center text-black font-semibold text-base mb-1 hover:scale-105 transition-transform">
                  {userData.name.charAt(0).toUpperCase() || "U"}
                </div>
              </>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6BCAE2] to-[#5AB9D1] flex items-center justify-center text-black font-semibold text-base mb-1 hover:scale-105 transition-transform">
                {userData.name.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <span className={cn(
              "transition-colors",
              currentPage === "profile" ? "text-[#6BCAE2]" : "text-white group-hover:text-[#6BCAE2]"
            )}>
              Profile
            </span>
          </Link>
          
          {/* Invisible bridge to keep tooltip open when moving mouse */}
          {showProfileTooltip && (
            <div 
              className="absolute left-10 top-0 w-12 h-full"
              onMouseEnter={() => setShowProfileTooltip(true)}
              onMouseLeave={() => setShowProfileTooltip(false)}
            />
          )}
          
          {/* Profile Tooltip - stays open when hovering over it */}
          {showProfileTooltip && (
            <div 
              className="absolute left-20 top-0 bg-[#1E2132] border border-gray-700 rounded-lg shadow-xl p-4 w-64 z-50 animate-in fade-in slide-in-from-left-2 duration-200"
              onMouseEnter={() => setShowProfileTooltip(true)}
              onMouseLeave={() => setShowProfileTooltip(false)}
            >
              <div className="flex items-center gap-3 mb-3 relative">
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
              <div className="pt-3 border-t border-gray-700">
                <Link 
                  href="/profile"
                  className="text-[#6BCAE2] text-sm hover:text-[#5AB9D1] transition-colors flex items-center gap-1"
                >
                  View full profile →
                </Link>
              </div>
            </div>
          )}
        </div>
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
