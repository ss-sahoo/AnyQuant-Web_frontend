"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function useRedirectIfAuthenticated() {
  const router = useRouter()
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem("auth_token")

    if (token) {
      router.push("/home")
    } else {
      setChecked(true) // Only show page if NOT authenticated
    }
  }, [])

  return checked
}
