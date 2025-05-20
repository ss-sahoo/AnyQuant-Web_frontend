"use client"

import { useRef, useEffect, useState } from "react"
import { DuplicateStrategyModal } from "@/components/duplicate-strategy-modal"
import { EditStrategyModal } from "@/components/edit-strategy-modal"
import type { Algorithm } from "@/lib/types"

interface AlgorithmMenuProps {
  algorithm: Algorithm
  onClose: () => void
  onDelete: (id: string) => void
  onDuplicate: (name: string, instrument: string) => void
  onEdit: (name: string, instrument: string) => void
}

export function AlgorithmMenu({ algorithm, onClose, onDelete, onDuplicate, onEdit }: AlgorithmMenuProps) {
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [menuPosition, setMenuPosition] = useState<"bottom" | "top">("bottom")
  const menuRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (showDuplicateModal || showEditModal) return
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    function updateMenuPosition() {
      if (menuRef.current) {
        const rect = menuRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top

        if (spaceBelow < 200 && spaceAbove > 200) {
          setMenuPosition("top")
        } else {
          setMenuPosition("bottom")
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    window.addEventListener("resize", updateMenuPosition)
    setTimeout(updateMenuPosition, 0)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      window.removeEventListener("resize", updateMenuPosition)
    }
  }, [showDuplicateModal, showEditModal, onClose])

  const getNumericId = () => algorithm.id.toString().split("-")[0]

  return (
    <>
      <div ref={containerRef} className="relative inline-block">
        <div
          ref={menuRef}
          className="absolute w-48 bg-white rounded-md shadow-lg overflow-hidden z-50"
          style={{
            top: menuPosition === "bottom" ? "100%" : undefined,
            bottom: menuPosition === "top" ? "100%" : undefined,
            right: 0,
            marginTop: menuPosition === "bottom" ? "8px" : undefined,
            marginBottom: menuPosition === "top" ? "8px" : undefined,
            marginRight: "12px", // ✅ right margin (gap from right edge)
          }}
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
                window.location.href = `/strategy-testing?id=${getNumericId()}`
                onClose()
              }}
            >
              Proceed to testing
            </button>
            <button
              className="w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(getNumericId())
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

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
