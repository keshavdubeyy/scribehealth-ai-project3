"use client"

import { useEffect } from "react"
import { useScribeStore } from "@/lib/mock-store"

export function StoreInitializer({ email }: { email: string }) {
  const setUserEmail = useScribeStore(s => s.setUserEmail)
  useEffect(() => {
    setUserEmail(email)
  }, [email, setUserEmail])
  return null
}
