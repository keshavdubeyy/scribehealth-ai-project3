"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import { format } from "date-fns"

interface PageHeaderProps {
  title?: string
  description?: string
  showWelcome?: boolean
}

export function PageHeader({ title, description }: PageHeaderProps) {
  const { data: session } = useSession()
  const firstName = session?.user?.name?.split(" ")[0] || (session?.user?.role === "ADMIN" ? "Admin" : "Doctor")
  const today = format(new Date(), "eeee, d MMMM yyyy")

  const displayTitle = title || `Hello, ${firstName}`
  const displaySub   = description || today

  return (
    <div className="flex flex-col gap-0.5 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {displayTitle}
      </h1>
      <p className="text-sm text-muted-foreground font-medium">
        {displaySub}
      </p>
    </div>
  )
}
