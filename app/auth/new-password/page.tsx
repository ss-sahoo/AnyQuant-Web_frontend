"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { Logo } from "@/components/auth/logo"
import { resetPassword } from "@/app/AllApiCalls"

export default function NewPasswordPage() {
  const router = useRouter()

  // const checked = useRedirectIfAuthenticated()

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")

  // Get stored email from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("signup_email")
    if (savedEmail) setEmail(savedEmail)
    else router.push("/auth/login") // redirect if no email found
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!newPassword) {
      setError("Please enter a new password.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    try {
      setLoading(true)

      await resetPassword({
        login_identifier: email,
        new_password: newPassword,
      })

      router.push("/auth/success")
    } catch (err: any) {
      setError(err.message || "Failed to reset password.")
    } finally {
      setLoading(false)
    }
  }

  // if (!checked) return null // or a spinner while checking

  return (
    <div className="min-h-screen bg-black flex flex-col justify-center items-center p-4">
      <Logo />

      <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center text-[#1e1e1e] mb-2">New Password</h1>
          <p className="text-gray-600 text-center mb-6">Set a new password for {email}</p>

          <form onSubmit={handleSubmit}>
            {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

            <div className="mb-6">
              <label htmlFor="new-password" className="block text-[#1e1e1e] mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#85e1fe] pr-10 text-black"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="confirm-password" className="block text-[#1e1e1e] mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#85e1fe] pr-10 text-black"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-full text-black font-medium transition-colors ${
                loading ? "bg-gray-300 cursor-not-allowed" : "bg-[#85e1fe] hover:bg-[#6bcae2]"
              }`}
            >
              {loading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
