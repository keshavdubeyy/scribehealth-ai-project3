"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"

interface UserRoleResult {
  role: string
  organizationId: string | null
  organizationName: string | null
  isAdmin: boolean
  isLoading: boolean
}

export function useUserRole(): UserRoleResult {
  const { data: session, status } = useSession()
  const [role, setRole]                       = useState<string>("DOCTOR")
  const [organizationId, setOrganizationId]   = useState<string | null>(null)
  const [organizationName, setOrganizationName] = useState<string | null>(null)
  const [isLoading, setIsLoading]             = useState(true)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated" || !session) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    fetch("/api/user/me")
      .then(res => res.json())
      .then(data => {
        setRole(data.role ?? "DOCTOR")
        setOrganizationId(data.organizationId ?? null)
        setOrganizationName(data.organizationName ?? null)
      })
      .catch(() => setRole("DOCTOR"))
      .finally(() => setIsLoading(false))
  }, [session, status])

  return { role, organizationId, organizationName, isAdmin: role === "ADMIN", isLoading }
}
