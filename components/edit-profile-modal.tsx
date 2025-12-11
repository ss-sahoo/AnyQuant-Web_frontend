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
    profile_image?: string | null
  }
  onClose: () => void
  onSave: (name: string, email: string, phone: string, profileImage?: File | null) => void
}

export function EditProfileModal({ userData, onClose, onSave }: EditProfileModalProps) {
  const [name, setName] = useState(userData.name)
  const [email, setEmail] = useState(userData.email)
  const [phone, setPhone] = useState(userData.phone)
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(userData.profile_image || null)
  const [removeImage, setRemoveImage] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const modalRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImage(file)
      setRemoveImage(false) // User is uploading new image, so don't remove
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageRemove = () => {
    setProfileImage(null)
    setProfileImagePreview(null)
    setRemoveImage(true) // Flag to indicate we want to remove the image
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const userId = localStorage.getItem("user_id")
      if (!userId) throw new Error("User ID not found")

      const updatedData = {
        username: name,
        email: email,
        phoneno: phone,
      }

      // Pass removeImage flag if user clicked remove button
      await updateUserProfile(userId, updatedData, profileImage as any, removeImage)

      // Call onSave to notify parent component and trigger data refresh
      await onSave(name, email, phone, profileImage)
    } catch (err) {
      console.error("Profile update failed:", err)
      alert("Something went wrong while updating profile.")
    } finally {
      setIsSubmitting(false)
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
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 pt-2">
          {/* Profile Image Upload */}
          <div className="mb-6">
            <label htmlFor="profile_image" className="block text-[#1e1e1e] text-lg font-medium mb-2">
              Profile Image
            </label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {profileImagePreview ? (
                  <img
                    src={profileImagePreview}
                    alt="Profile preview"
                    className="w-20 h-20 rounded-full object-cover border-2 border-gray-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6BCAE2] to-[#5AB9D1] flex items-center justify-center text-black font-semibold text-2xl">
                    {name.charAt(0).toUpperCase() || "U"}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  id="profile_image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isSubmitting}
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-[#1e1e1e] text-sm transition-colors disabled:opacity-70"
                    disabled={isSubmitting}
                  >
                    {profileImagePreview ? "Change" : "Upload"}
                  </button>
                  {(profileImagePreview || userData.profile_image) && (
                    <button
                      type="button"
                      onClick={handleImageRemove}
                      className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-red-700 text-sm transition-colors disabled:opacity-70"
                      disabled={isSubmitting}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-1">JPG, PNG or GIF. Max size 5MB</p>
              </div>
            </div>
          </div>

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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3 bg-[#6BCAE2] rounded-full text-[#1e1e1e] hover:bg-[#5AB9D1] transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </form>
      </div>
    </div>
  )
}
