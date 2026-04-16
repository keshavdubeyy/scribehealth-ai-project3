"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { useScribeStore } from "@/lib/mock-store"

export function SiteHeader() {
  const pathname = usePathname()
  const { patients } = useScribeStore()

  const breadcrumbs = React.useMemo(() => {
    const segments = pathname.split("/").filter(Boolean)
    const list: { label: string; href: string; active: boolean }[] = []

    if (pathname === "/patients/dashboard" || pathname.startsWith("/patients/dashboard")) {
      list.push({ label: "Dashboard", href: "/patients/dashboard", active: pathname === "/patients/dashboard" })
      if (pathname.includes("profile"))               list.push({ label: "Profile",               href: pathname, active: true })
      if (pathname.includes("users"))                 list.push({ label: "Users",                 href: pathname, active: true })
      if (pathname.includes("prescription-template")) list.push({ label: "Prescription template", href: pathname, active: true })
    } else if (pathname.startsWith("/patients")) {
      list.push({ label: "Patients", href: "/patients", active: segments.length === 1 })

      const patientId = segments[1]
      if (patientId && patientId !== "dashboard") {
        const patient = patients.find(p => p.id === patientId)
        list.push({
          label:  patient?.name ?? "Patient",
          href:   `/patients/${patientId}`,
          active: segments.length === 2,
        })

        if (segments.includes("sessions")) {
          list.push({ label: "Session", href: pathname, active: true })
        }
      }
    }

    return list
  }, [pathname, patients])

  return (
    <header className="flex h-(--header-height) shrink-0 items-center border-b border-border bg-background sticky top-0 z-40 px-4">
      <div className="flex items-center gap-3 h-full">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.href + i}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.active ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
}
