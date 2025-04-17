"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X, Eye, EyeOff } from "lucide-react"

interface DeleteAccountModalProps {
  onClose: () => void
  onDelete: (password: string) => void
}

export function DeleteAccountModal({ onClose, onDelete }: DeleteAccountModalProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")

  const modalRef = useRef<HTMLDivElement>(null)

  // Handle click outside to close the modal
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose])

  // Handle ESC key to close the modal
  useEffect(() => {
    function handleEscKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleEscKey)
    return () => {
      document.removeEventListener("keydown", handleEscKey)
    }
  }, [onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!password) {
      setError("Password is required")
      return
    }

    onDelete(password)
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-xl shadow-lg w-full max-w-md relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-2">
          <h2 className="text-[#1e1e1e] text-2xl font-bold">Delete Account</h2>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            className="text-[#1e1e1e] hover:bg-gray-200 rounded-full p-1"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-500 px-6 mb-4">This action is permanent and cannot be reversed.</p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

          <div className="mb-8">
            <label htmlFor="password" className="block text-[#1e1e1e] text-lg font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-red-500 pr-10"
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
          </div>

          {/* Delete Button */}
          <button
            type="submit"
            className="w-full py-3 bg-red-600 rounded-full text-white hover:bg-red-700 transition-colors font-medium"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  )
}
