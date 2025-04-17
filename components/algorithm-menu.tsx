"use client"

import { useRef, useEffect, useState } from "react"
import { DuplicateStrategyModal } from "@/components/duplicate-strategy-modal"
import { EditStrategyModal } from "@/components/edit-strategy-modal"
import type { Algorithm } from "@/lib/types"

interface AlgorithmMenuProps {
  algorithm: Algorithm
  onClose: () => void
  onDelete: () => void
  onDuplicate: (name: string, instrument: string) => void
  onEdit: (name: string, instrument: string) => void
}

export function AlgorithmMenu({ algorithm, onClose, onDelete, onDuplicate, onEdit }: AlgorithmMenuProps) {
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Don't close the menu if we're clicking inside a modal
      if (showDuplicateModal || showEditModal) return

      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [onClose, showDuplicateModal, showEditModal])

  return (
    <>
      <div
        ref={menuRef}
        className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg z-10 overflow-hidden"
        style={{ transform: "translateX(-16px)" }}
      >
        <div className="py-1 text-gray-900">
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setShowEditModal(true)
            }}
          >
            Edit strategy
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setShowDuplicateModal(true)
            }}
          >
            Duplicate
          </button>
          <button
            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              // Handle proceed to testing - redirect to testing page
              window.location.href = `/strategy-testing?id=${algorithm.id}`
              onClose()
            }}
          >
            Proceed to testing
          </button>
          <button
            className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Duplicate Strategy Modal */}
      {showDuplicateModal && (
        <DuplicateStrategyModal
          strategy={algorithm}
          onClose={() => {
            setShowDuplicateModal(false)
            onClose()
          }}
          onSave={(name, instrument) => {
            onDuplicate(name, instrument)
          }}
        />
      )}

      {/* Edit Strategy Modal */}
      {showEditModal && (
        <EditStrategyModal
          strategy={algorithm}
          isEdit={true}
          onClose={() => {
            setShowEditModal(false)
            onClose()
          }}
          onSave={(name, instrument) => {
            onEdit(name, instrument)
          }}
        />
      )}
    </>
  )
}
