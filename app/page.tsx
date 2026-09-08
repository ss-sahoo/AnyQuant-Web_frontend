"use client"

import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    window.location.href = "/auth"
  }, [])

  return (
    <div className="min-h-screen bg-black flex justify-center items-center">
      <div className="text-white text-lg">Redirecting to login...</div>
    </div>
  )
}
