"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useScribeStore } from "@/lib/mock-store"
import { ChevronRight } from "lucide-react"

export function SiteHeader() {
  const pathname = usePathname()
  const { patients, sessions } = useScribeStore()
  
  const segments = pathname.split("/").filter(Boolean)
  
  // Breadcrumb generation logic
  const breadcrumbs = React.useMemo(() => {
    const list = [
      { label: "Clinical Workspace", href: "/patients", active: false }
    ]

    if (segments.includes("patients")) {
      list.push({ label: "Patient Directory", href: "/patients", active: segments.length === 1 })
      
      const patientId = segments[1]
      if (patientId && patientId !== "sessions") {
        const patient = patients.find(p => p.id === patientId)
        list.push({ 
          label: patient?.name || "Patient Record", 
          href: `/patients/${patientId}`,
          active: segments.length === 2
        })

        if (segments.includes("sessions")) {
          const sessionId = segments[3]
          if (sessionId) {
            const patientSessions = sessions.filter(s => s.patientId === patientId)
            const sessionIndex = patientSessions.length - patientSessions.findIndex(s => s.id === sessionId)
            list.push({ 
              label: `Session ${sessionIndex || ""}`, 
              href: `/patients/${patientId}/sessions/${sessionId}`,
              active: true
            })
          }
        }
      }
    }

    return list
  }, [pathname, patients, sessions, segments])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center justify-between border-b bg-background/50 backdrop-blur-md sticky top-0 z-40 px-4">
      <div className="flex flex-1 items-center gap-4 h-full">
        <div className="flex items-center justify-center h-full min-w-8">
          <SidebarTrigger className="text-muted-foreground/50 hover:text-primary transition-colors" />
        </div>
        <Separator
          orientation="vertical"
          className="h-5 opacity-30 bg-border self-center"
        />
        <nav className="flex items-center gap-1.5 overflow-hidden py-1">
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.href + i}>
              {i > 0 && <ChevronRight className="size-3 text-muted-foreground/30 shrink-0" />}
              <Link
                href={crumb.href}
                className={`
                  text-[11px] font-bold tracking-tight transition-all truncate
                  ${crumb.active 
                    ? "text-foreground cursor-default pointer-events-none" 
                    : "text-muted-foreground/60 hover:text-primary"}
                `}
              >
                {crumb.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>
      </div>
    </header>
  )
}
