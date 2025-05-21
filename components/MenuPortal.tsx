"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { createPortal } from "react-dom"

interface MenuPortalProps {
  children: React.ReactNode
  anchorRef: React.RefObject<HTMLElement>
  position: "top" | "bottom"
  onClose: () => void
}

export function MenuPortal({ children, anchorRef, position, onClose }: MenuPortalProps) {
  const [container] = useState(() => document.createElement("div"))
  const [mounted, setMounted] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Only run on client side
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  useEffect(() => {
    if (!anchorRef.current) return

    // Use fixed positioning to ensure the menu is positioned relative to the viewport
    container.style.position = "fixed"
    container.style.zIndex = "9999"
    container.style.width = "192px" // same as tailwind w-48

    // Function to update menu position based on anchor element
    const updatePosition = () => {
      if (!anchorRef.current) return

      const anchorRect = anchorRef.current.getBoundingClientRect()
      const menuHeight = 160 // Estimate menu height
      const windowHeight = window.innerHeight
      const windowWidth = window.innerWidth

      // Determine if menu should be above or below
      let finalPosition = position
      if (position === "bottom" && anchorRect.bottom + menuHeight > windowHeight) {
        // Not enough space below, try to position above
        if (anchorRect.top > menuHeight) {
          finalPosition = "top"
        }
      } else if (position === "top" && anchorRect.top - menuHeight < 0) {
        // Not enough space above, try to position below
        if (windowHeight - anchorRect.bottom > menuHeight) {
          finalPosition = "bottom"
        }
      }

      // Calculate top position
      let top
      if (finalPosition === "bottom") {
        top = anchorRect.bottom
      } else {
        top = anchorRect.top - menuHeight
      }

      // Calculate left position (align right edge of menu with right edge of button)
      let left = anchorRect.right - 192 // 192px is the width of the menu

      // Ensure menu doesn't go off the left edge of the screen
      if (left < 8) {
        left = 8
      }

      // Ensure menu doesn't go off the right edge of the screen
      if (left + 192 > windowWidth - 8) {
        left = windowWidth - 192 - 8
      }

      // Apply the calculated position
      container.style.top = `${top}px`
      container.style.left = `${left}px`
    }

    // Add the container to the document body
    document.body.appendChild(container)

    // Update position immediately
    updatePosition()

    // Update position on scroll and resize
    window.addEventListener("scroll", updatePosition, true) // true for capture phase to get all scroll events
    window.addEventListener("resize", updatePosition)

    // Handle click outside
    const handleClickOutside = (event: MouseEvent) => {
      // Don't close if clicking inside the menu or on the anchor element
      if (
        container.contains(event.target as Node) ||
        (anchorRef.current && anchorRef.current.contains(event.target as Node))
      ) {
        return
      }

      // Use setTimeout to allow other click handlers to execute first
      // This prevents the menu from closing immediately when opening a modal
      setTimeout(() => {
        onClose()
      }, 0)
    }

    // Handle escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("scroll", updatePosition, true)
      window.removeEventListener("resize", updatePosition)
      document.body.removeChild(container)
    }
  }, [anchorRef, position, container, onClose])

  // Only render the portal on the client
  if (!mounted || !anchorRef.current) return null

  return createPortal(
    <div ref={menuRef} className="rounded-md shadow-lg overflow-hidden">
      {children}
    </div>,
    container,
  )
}
