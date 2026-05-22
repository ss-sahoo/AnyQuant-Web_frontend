"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

interface DraggableModalProps {
  onClose: () => void
  children: ReactNode
  className?: string
  closeOnBackdrop?: boolean
  initialPosition?: { x: number; y: number }
}

export function DraggableModal({
  onClose,
  children,
  className = "",
  closeOnBackdrop = true,
  initialPosition,
}: DraggableModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    initialPosition ?? null,
  )
  const [dragging, setDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (position !== null || !modalRef.current) return
    const rect = modalRef.current.getBoundingClientRect()
    setPosition({
      x: Math.max(8, (window.innerWidth - rect.width) / 2),
      y: Math.max(8, (window.innerHeight - rect.height) / 2),
    })
  }, [position])

  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      if (!modalRef.current) return
      const rect = modalRef.current.getBoundingClientRect()
      const maxX = Math.max(0, window.innerWidth - rect.width)
      const maxY = Math.max(0, window.innerHeight - rect.height)
      const nextX = Math.min(Math.max(0, e.clientX - dragOffset.current.x), maxX)
      const nextY = Math.min(Math.max(0, e.clientY - dragOffset.current.y), maxY)
      setPosition({ x: nextX, y: nextY })
    }
    const onUp = () => setDragging(false)
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [dragging])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (
      target.closest(
        "button, input, select, textarea, a, [contenteditable], [data-no-drag]",
      )
    ) {
      return
    }
    if (!modalRef.current) return
    const rect = modalRef.current.getBoundingClientRect()
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    setDragging(true)
    e.preventDefault()
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-20 z-40"
        onMouseDown={closeOnBackdrop ? onClose : undefined}
      />
      <div
        ref={modalRef}
        onMouseDown={handleMouseDown}
        style={{
          position: "fixed",
          left: position?.x ?? 0,
          top: position?.y ?? 0,
          visibility: position ? "visible" : "hidden",
          zIndex: 50,
          cursor: dragging ? "grabbing" : "grab",
          userSelect: dragging ? "none" : "auto",
        }}
        className={className}
      >
        {children}
      </div>
    </>
  )
}
