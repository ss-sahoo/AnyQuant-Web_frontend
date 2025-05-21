"use client"

import { useState, useEffect } from "react"
import { Sidebar } from "@/components/sidebar"
import { MobileSidebar } from "@/components/mobile-sidebar"
import { EditProfileModal } from "@/components/edit-profile-modal"
import { ChangePasswordModal } from "@/components/change-password-modal"
import { DeleteAccountModal } from "@/components/delete-account-modal"
import { ArrowRight } from "lucide-react"
import { getUserProfile } from "@/app/AllApiCalls"

export function ProfilePage() {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    login: "50349898549",
    server: "AnyQuant-Demo",
    connected: "Access Point NG 1",
  })

  // Function to fetch user profile data
  const fetchUserProfile = async () => {
    const userId = localStorage.getItem("user_id")
    if (userId) {
      try {
        const data = await getUserProfile(userId)
        setUserData((prev) => ({
          ...prev,
          name: data.username,
          email: data.email,
          phone: data.phoneno || "Not Provided",
        }))
      } catch (err) {
        console.error("Failed to load profile", err)
      }
    }
  }

  // Initial data load
  useEffect(() => {
    fetchUserProfile()
  }, [])

  const handleSaveProfile = async (name: string, email: string, phone: string) => {
    console.log("Saving profile:", { name, email, phone })
    setShowEditModal(false)
    // Refresh user data after profile update
    await fetchUserProfile()
  }

  const handleChangePassword = (oldPassword: string, newPassword: string) => {
    console.log("Changing password")
    setShowPasswordModal(false)
  }

  const handleDeleteAccount = (password: string) => {
    console.log("Deleting account")
    setShowDeleteModal(false)
  }

  return (
    <div className="flex min-h-screen bg-[#121420] text-white">
      <div className="hidden md:block">
        <Sidebar currentPage="profile" />
      </div>

      <MobileSidebar currentPage="profile" />

      <main className="flex-1 p-4 md:p-8 w-full">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-normal">Profile</h1>
            <button
              onClick={() => setShowEditModal(true)}
              className="bg-[#6BCAE2] hover:bg-[#5AB9D1] text-black rounded-full px-6 py-2"
            >
              Edit Details
            </button>
          </div>

          <div className="bg-[#1E2132] rounded-lg p-6">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Name</span>
                <span>{userData.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Email</span>
                <span>{userData.email}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Phone</span>
                <span>{userData.phone}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Login</span>
                <span>{userData.login}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Server</span>
                <span>{userData.server}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-300">Connected</span>
                <span>{userData.connected}</span>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-300">Change Password</span>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="text-gray-300 hover:text-white flex items-center"
                >
                  Change <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-red-500">Delete Account</span>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-gray-300 hover:text-white flex items-center"
                >
                  Delete <ArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showEditModal && (
        <EditProfileModal userData={userData} onClose={() => setShowEditModal(false)} onSave={handleSaveProfile} />
      )}

      {showPasswordModal && (
        <ChangePasswordModal onClose={() => setShowPasswordModal(false)} onSave={handleChangePassword} />
      )}

      {showDeleteModal && (
        <DeleteAccountModal onClose={() => setShowDeleteModal(false)} onDelete={handleDeleteAccount} />
      )}
    </div>
  )
}
