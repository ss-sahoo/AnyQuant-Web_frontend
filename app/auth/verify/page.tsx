"use client"

import type React from "react"

import { verifyOtp } from "@/app/AllApiCalls"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Logo } from "@/components/auth/logo" // Fixed import to use named export
import { useRedirectIfAuthenticated } from "@/hooks/useRedirectIfAuthenticated"

export default function VerifyPage() {
  const router = useRouter()

  const checked = useRedirectIfAuthenticated()

  const [code, setCode] = useState(["", "", "", "", ""])
  const [timeLeft, setTimeLeft] = useState(180) // 3 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [email, setEmail] = useState("")
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const savedEmail = localStorage.getItem("signup_email")
    if (savedEmail) setEmail(savedEmail)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const otp = code.join("")

    try {
      setVerifying(true)
      const data = await verifyOtp({ login_identifier: email, password: otp })

      localStorage.setItem("auth_token", data.token)
      router.push("/home")
    } catch (err) {
      alert("Invalid OTP")
    } finally {
      setVerifying(false)
    }
  }

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1)
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft])

  // Format time as MM:SS
  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60)
    const seconds = timeLeft % 60
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
  }

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Auto-focus next input
    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // const handleSubmit = (e: React.FormEvent) => {
  //   e.preventDefault()

  //   // Check if code is complete
  //   if (code.some((digit) => !digit)) {
  //     return
  //   }

  //   // In a real app, this would verify the code with an API
  //   // For now, we'll just redirect to the new password page
  //   router.push("/auth/new-password")
  // }

  // const handleResend = () => {
  //   // In a real app, this would call an API to resend the code
  //   setTimeLeft(180) // Reset timer
  // }

  // Update the verification page layout

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
            <h1 className="text-2xl font-bold text-center flex-1 pr-10">Verification Code</h1>
          </div>

          <div className="text-center mb-6">
            <p className="text-gray-600">A code has been sent to your email address.</p>
            <p className="text-gray-600">derick@buildas.io</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="code-1" className="block text-[#1e1e1e] mb-4">
                Enter verification code
              </label>
              <div className="flex gap-2 justify-between">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#85e1fe] text-black"
                  />
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-gray-700">
                If you didn't receive any code.{" "}
                <button
                  type="button"
                  // onClick={handleResend}
                  className="text-[#85e1fe] hover:underline"
                  disabled={timeLeft > 0}
                >
                  Resend
                </button>
              </p>
              <span className="text-sm">{formatTime()}</span>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-[#85e1fe] rounded-full text-black font-medium hover:bg-[#6bcae2] transition-colors"
            >
              Finish
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
