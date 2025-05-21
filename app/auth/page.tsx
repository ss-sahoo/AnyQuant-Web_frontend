"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AuthForm } from "@/components/auth/auth-form"
import { Logo } from "@/components/auth/logo"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup")
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    const token = localStorage.getItem("auth_token")
    if (token) {
      // User is already logged in, redirect to home page
      router.replace("/home")
    } else {
      // No token found, show the auth form
      setIsLoading(false)
    }
  }, [router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex justify-center items-center">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4">
      <Logo />
      <AuthForm activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
