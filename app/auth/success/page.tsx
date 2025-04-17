"use client"

import { useRouter } from "next/navigation"
import { Check } from "lucide-react"
import { Logo } from "@/components/auth/logo"

export default function SuccessPage() {
  const router = useRouter()

  // const checked = useRedirectIfAuthenticated()

  const handleLogin = () => {
    router.push("/auth")
  }

  // if (!checked) return null // or a spinner while checking
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4">
      <Logo />

      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-center text-[#1e1e1e] mb-8">
            Your password has been successfully changed.
          </h1>

          <div className="w-20 h-20 rounded-full bg-[#85e1fe] flex items-center justify-center mb-8">
            <Check className="w-10 h-10 text-white" />
          </div>

          <button
            onClick={handleLogin}
            className="w-full py-4 bg-[#85e1fe] rounded-full text-black font-medium hover:bg-[#6bcae2] transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  )
}
