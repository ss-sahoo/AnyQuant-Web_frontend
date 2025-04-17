"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { X } from "lucide-react"
import { updateUserProfile } from "@/app/AllApiCalls"

interface EditProfileModalProps {
  userData: {
    name: string
    email: string
    phone: string
  }
  onClose: () => void
  onSave: (name: string, email: string, phone: string) => void
}

export function EditProfileModal({ userData, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(userData.name)
  const [email, setEmail] = useState(userData.email)
  const [phone, setPhone] = useState(userData.phone)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const userId = localStorage.getItem("user_id")
      if (!userId) throw new Error("User ID not found")

      const updatedData = {
        username: name,
        email: email,
      }

      await updateUserProfile(userId, updatedData)
      onSave(name, email, phone) // Update the parent UI
    } catch (err) {
      console.error("Profile update failed:", err)
      alert("Something went wrong while updating profile.")
    }
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
        <div className="flex justify-between items-center p-6 pb-4">
          <h2 className="text-[#1e1e1e] text-2xl font-bold">Edit Profile</h2>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          <div className="mb-6">
            <label htmlFor="name" className="block text-[#1e1e1e] text-lg font-medium mb-2">
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#6BCAE2]"
              required
            />
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-[#1e1e1e] text-lg font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#6BCAE2]"
              required
            />
          </div>

          <div className="mb-8">
            <label htmlFor="phone" className="block text-[#1e1e1e] text-lg font-medium mb-2">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-[#1e1e1e] focus:outline-none focus:ring-2 focus:ring-[#6BCAE2]"
              required
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#6BCAE2] rounded-full text-[#1e1e1e] hover:bg-[#5AB9D1] transition-colors font-medium"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  )
}
