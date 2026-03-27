"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { DuplicateStrategyModal } from "@/components/duplicate-strategy-modal"
import { EditStrategyModal } from "@/components/edit-strategy-modal"
import { MenuPortal } from "@/components/MenuPortal"
import type { Algorithm } from "@/lib/types"

interface AlgorithmMenuProps {
  anchorRef: React.RefObject<HTMLElement>
  algorithm: Algorithm
  onClose: () => void
  onDelete: (id: string) => void
  onDuplicate: (name: string, instrument: string) => void
  onEdit: (name: string) => void
  onAddToShortlist?: (id: string) => void
  onRemoveFromShortlist?: (id: string) => void
  isShortlisted?: boolean
}

export function AlgorithmMenu({ anchorRef, algorithm, onClose, onDelete, onDuplicate, onEdit, onAddToShortlist, onRemoveFromShortlist, isShortlisted = false }: AlgorithmMenuProps) {
  const [position, setPosition] = useState<"top" | "bottom">("bottom")
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [menuVisible, setMenuVisible] = useState(true)

  useEffect(() => {
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      setPosition(spaceBelow < 180 && spaceAbove > 180 ? "top" : "bottom")
    }
  }, [anchorRef])

  const getNumericId = () => algorithm.id.toString().split("-")[0]

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowEditModal(true)
    setMenuVisible(false) // Hide the menu when modal opens
  }

  const handleDuplicateClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDuplicateModal(true)
    setMenuVisible(false) // Hide the menu when modal opens
  }

  const handleModalClose = () => {
    setShowEditModal(false)
    setShowDuplicateModal(false)
    onClose() // Close the menu completely when modal is closed
  }

  const MenuContent = (
    <div className="w-48 bg-white rounded-md shadow-lg z-[9999] text-sm text-gray-900">
      <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={handleEditClick}>
        Edit strategy
      </button>
      <button className="w-full text-left px-4 py-2 hover:bg-gray-100" onClick={handleDuplicateClick}>
        Duplicate
      </button>
      {!isShortlisted && onAddToShortlist && (
        <button
          className="w-full text-left px-4 py-2 hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation()
            onAddToShortlist(getNumericId())
            onClose()
          }}
        >
          Add to Shortlist
        </button>
      )}
      <button
        className="w-full text-left px-4 py-2 hover:bg-gray-100"
        onClick={(e) => {
          e.stopPropagation()
          window.location.href = `/strategy-testing?id=${getNumericId()}`
          onClose()
        }}
      >
        Proceed to testing
      </button>
      {isShortlisted && onRemoveFromShortlist ? (
        <button
          className="w-full text-left px-4 py-2 text-orange-600 hover:bg-gray-100"
          onClick={(e) => {
            e.stopPropagation()
            onRemoveFromShortlist(getNumericId())
            onClose()
          }}
        >
          Remove from Shortlist
        </button>
      ) : null}
      <button
        className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
        onClick={(e) => {
          e.stopPropagation()
          onDelete(getNumericId())
          onClose()
        }}
      >
        Delete
      </button>
    </div>
  )

  return (
    <>
      {menuVisible && (
        <MenuPortal anchorRef={anchorRef} position={position} onClose={onClose}>
          {MenuContent}
        </MenuPortal>
      )}

      {showDuplicateModal && (
        <DuplicateStrategyModal
          strategy={algorithm}
          onClose={handleModalClose}
          onSave={(name, instrument) => {
            onDuplicate(name, instrument)
            handleModalClose()
          }}
        />
      )}

      {showEditModal && (
        <EditStrategyModal
          strategy={algorithm}
          isEdit={true}
          onClose={handleModalClose}
          onSave={(name) => {
            onEdit(name)
            handleModalClose()
          }}
        />
      )}
    </>
  )
}
