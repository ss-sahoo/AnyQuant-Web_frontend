// components/AuthGuard.tsx
"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("auth_token")
    if (!token) {
      router.replace("/auth") // use replace to avoid back button showing /home
    } else {
      setChecked(true)
    }
  }, [])

  if (!checked) {
    return <div className="min-h-screen flex justify-center items-center text-white">Loading...</div>
  }

  return <>{children}</>
}
