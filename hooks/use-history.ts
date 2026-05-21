import { useCallback, useEffect, useRef, useState } from "react"

const MAX_HISTORY = 100

interface HistoryControls {
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  resetHistory: () => void
  // Mark the next state change as a non-user transition (e.g. initial load
  // from the server) so it does not create an undo entry.
  skipNextChange: () => void
}

// Tracks history of a piece of state externally so it works even when the
// owner mutates state in place before calling its setter (a pattern used in
// strategy-builder.tsx). On every change we deep-snapshot the previous render's
// state via JSON.stringify, decoupling history entries from any future
// mutations of the live reference.
export function useHistory<T>(state: T, setState: (v: T) => void): HistoryControls {
  const pastRef = useRef<string[]>([])
  const futureRef = useRef<string[]>([])
  const lastJsonRef = useRef<string>("")
  // Set when undo/redo applies a snapshot — the resulting state-change effect
  // must skip pushing onto the past stack, otherwise undo creates a new entry.
  const applyingRef = useRef(false)
  const [, bump] = useState(0)
  const tick = useCallback(() => bump(x => x + 1), [])

  useEffect(() => {
    let json: string
    try {
      json = JSON.stringify(state)
    } catch {
      return
    }
    if (json === lastJsonRef.current) {
      // After undo/redo, lastJsonRef was set to the snapshot we're applying,
      // so this re-render lands here. Clear the flag — otherwise it stays
      // armed and silently swallows the user's next real change.
      applyingRef.current = false
      return
    }
    if (applyingRef.current) {
      applyingRef.current = false
      lastJsonRef.current = json
      return
    }
    if (lastJsonRef.current) {
      pastRef.current.push(lastJsonRef.current)
      if (pastRef.current.length > MAX_HISTORY) pastRef.current.shift()
      futureRef.current = []
    }
    lastJsonRef.current = json
    tick()
  }, [state, tick])

  const undo = useCallback(() => {
    if (pastRef.current.length === 0) return
    const prev = pastRef.current.pop()!
    if (lastJsonRef.current) futureRef.current.push(lastJsonRef.current)
    lastJsonRef.current = prev
    applyingRef.current = true
    try {
      setState(JSON.parse(prev) as T)
    } catch {
      applyingRef.current = false
    }
    tick()
  }, [setState, tick])

  const redo = useCallback(() => {
    if (futureRef.current.length === 0) return
    const next = futureRef.current.pop()!
    if (lastJsonRef.current) pastRef.current.push(lastJsonRef.current)
    lastJsonRef.current = next
    applyingRef.current = true
    try {
      setState(JSON.parse(next) as T)
    } catch {
      applyingRef.current = false
    }
    tick()
  }, [setState, tick])

  const resetHistory = useCallback(() => {
    pastRef.current = []
    futureRef.current = []
    try {
      lastJsonRef.current = JSON.stringify(state)
    } catch {
      lastJsonRef.current = ""
    }
    tick()
  }, [state, tick])

  const skipNextChange = useCallback(() => {
    applyingRef.current = true
  }, [])

  return {
    undo,
    redo,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    resetHistory,
    skipNextChange,
  }
}
