"use client"

import React, { createContext, useContext } from "react"
import { useScribe } from "@/hooks/use-scribe"

const ScribeContext = createContext<any>(null)

export function ScribeProvider({ children }: { children: React.ReactNode }) {
  const scribe = useScribe()
  return <ScribeContext.Provider value={scribe}>{children}</ScribeContext.Provider>
}

export function useScribeContext() {
  const context = useContext(ScribeContext)
  if (!context) throw new Error("useScribeContext must be used within ScribeProvider")
  return context
}
