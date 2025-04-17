"use client"

import { useState } from "react"
import { AuthForm } from "@/components/auth/auth-form"
import { Logo } from "@/components/auth/logo"

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<"login" | "signup">("signup")
  // const checked = useRedirectIfAuthenticated()

  // if (!checked) return null // or a spinner while checking

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4">
      <Logo />
      <AuthForm activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  )
}
