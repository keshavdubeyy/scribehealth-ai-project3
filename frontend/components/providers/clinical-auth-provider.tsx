"use client"

import { useSession } from "next-auth/react"
import { useEffect } from "react"
import { useScribeStore } from "@/lib/mock-store"

export function ClinicalAuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const setToken = useScribeStore((state) => (state as any).setToken)

  useEffect(() => {
    if (session?.user?.accessToken) {
      setToken(session.user.accessToken)
    } else {
      setToken(null)
    }
  }, [session, setToken])

  return <>{children}</>
}
