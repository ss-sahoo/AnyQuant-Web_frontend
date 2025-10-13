"use client"

import { useEffect } from "react"

export default function Home() {
  useEffect(() => {
    // Redirect to external waitlist page
    window.location.href = "https://www.anyquant.co.uk/waitlist"
  }, [])

  return (
    <div className="min-h-screen bg-black flex justify-center items-center">
      <div className="text-white text-lg">Redirecting to waitlist...</div>
    </div>
  )
}
