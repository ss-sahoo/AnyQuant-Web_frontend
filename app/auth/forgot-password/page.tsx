"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/auth/logo"
import { sendOtpEmail } from "@/app/AllApiCalls" // 👈 make sure this is imported
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated"

export default function ForgotPasswordPage() {
  const router = useRouter()

  const checked = useRedirectIfAuthenticated()

  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address.")
      return
    }

    try {
      setLoading(true)

      // Call your OTP email sender API
      await sendOtpEmail(email)

      // Save email locally so it can be used in verification page
      localStorage.setItem("signup_email", email)

      // Redirect to verification
      router.push("/auth/verify-login")
    } catch (err: any) {
      setError("Failed to send OTP. Please try again.")
      console.error("OTP Error:", err)
    } finally {
      setLoading(false)
    }
  }

  if (!checked) return null // or a spinner while checking
  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4">
      <Logo />

      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <div className="flex items-center mb-4">
            <button onClick={() => router.back()} className="p-2 rounded-full border border-gray-300 hover:bg-gray-100">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-center flex-1 pr-10">Forgot Password?</h1>
          </div>

          <p className="text-gray-600 mb-6 text-center">
            Enter the email address associated with your account. We will send you an email to reset your password.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-[#1e1e1e] mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3 border ${
                  error ? "border-red-500" : "border-gray-300"
                } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black`}
              />
              {error && <p className="mt-1 text-red-500 text-sm">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-full text-black font-medium transition-colors ${
                loading ? "bg-gray-300 cursor-not-allowed" : "bg-[#85e1fe] hover:bg-[#6bcae2]"
              }`}
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
