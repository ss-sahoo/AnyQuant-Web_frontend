"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"
import { GoogleIcon } from "@/components/auth/google-icon"
import { AppleIcon } from "@/components/auth/apple-icon"
import { createAccount, sendOtpEmail, loginUser } from "@/app/AllApiCalls"

interface AuthFormProps {
  activeTab: "login" | "signup"
  setActiveTab: (tab: "login" | "signup") => void
}

export function AuthForm({ activeTab, setActiveTab }: AuthFormProps) {
  const router = useRouter()
  const [fullname, setFullname] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [termsError, setTermsError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setEmailError("")
    setPasswordError("")
    setTermsError("")
    let hasError = false

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError("Invalid or incorrect email address.")
      hasError = true
    }

    if (!password) {
      setPasswordError("Password cannot be empty.")
      hasError = true
    }

    if (activeTab === "signup" && !agreedToTerms) {
      setTermsError("You must agree to the terms and privacy policy.")
      hasError = true
    }

    if (hasError) return

    setLoading(true)

    try {
      if (activeTab === "login") {
        const data = await loginUser({ email, password })
        localStorage.setItem("auth_token", data.access)
        localStorage.setItem("user_id", data.user_id)

        router.push("/home")
      } else {
        await createAccount({ username: fullname, email, password })
        await sendOtpEmail(email)
        localStorage.setItem("signup_email", email)
        router.push("/auth/verify")
      }
    } catch (error) {
      // setEmailError(error.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    router.push("/auth/forgot-password")
  }

  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden">
      <div className="flex">
        <button
          className={`flex-1 py-4 text-center font-medium ${
            activeTab === "login" ? "bg-white text-black" : "bg-[#9d9d9d] text-white"
          }`}
          onClick={() => setActiveTab("login")}
        >
          Login
        </button>
        <button
          className={`flex-1 py-4 text-center font-medium ${
            activeTab === "signup" ? "bg-white text-black" : "bg-[#9d9d9d] text-white"
          }`}
          onClick={() => setActiveTab("signup")}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        {activeTab === "signup" && (
          <div className="mb-6">
            <label htmlFor="fullname" className="block text-[#1e1e1e] mb-2">
              Fullname
            </label>
            <input
              id="fullname"
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
              required
            />
          </div>
        )}

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
              emailError ? "border-red-500" : "border-gray-300"
            } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black`}
          />
          {emailError && <p className="mt-1 text-red-500 text-sm">{emailError}</p>}
        </div>

        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-[#1e1e1e]">
              Password
            </label>
            {activeTab === "login" && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-gray-500 text-sm hover:text-gray-700"
              >
                Forgot Password?
              </button>
            )}
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full p-4 border-2 ${
                passwordError ? "border-red-500" : "border-gray-300"
              } rounded-lg focus:outline-none focus:ring-1 focus:ring-[#85e1fe] pr-10 text-black`}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {passwordError && <p className="mt-1 text-red-500 text-sm">{passwordError}</p>}
        </div>

        {activeTab === "signup" && (
          <div className="mb-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 border border-gray-300 rounded focus:ring-[#85e1fe]"
                />
              </div>
              <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                By checking this box you agree with AnyQuant{" "}
                <a href="#" className="text-[#85e1fe] hover:underline">
                  terms of use
                </a>{" "}
                and{" "}
                <a href="#" className="text-[#85e1fe] hover:underline">
                  privacy policy
                </a>
                .
              </label>
            </div>
            {termsError && <p className="mt-1 text-red-500 text-sm">{termsError}</p>}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-full text-black font-medium transition-colors ${
            loading ? "bg-gray-300 cursor-not-allowed" : "bg-[#85e1fe] hover:bg-[#6bcae2]"
          }`}
        >
          {loading
            ? activeTab === "login"
              ? "Signing In..."
              : "Signing Up..."
            : activeTab === "login"
              ? "Sign In"
              : "Sign Up"}
        </button>

        <div className="mt-8 text-center relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative">
            <span className="px-4 bg-white text-gray-500">{activeTab === "login" ? "or" : "or sign up with"}</span>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <button
            type="button"
            className="w-full py-3 border border-gray-300 rounded-full flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <GoogleIcon />
            <span className="text-[#1e1e1e]">Sign in with Google</span>
          </button>
          <button
            type="button"
            className="w-full py-3 border border-gray-300 rounded-full flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
          >
            <AppleIcon />
            <span className="text-[#1e1e1e]">Sign in with Apple</span>
          </button>
        </div>
      </form>
    </div>
  )
}
