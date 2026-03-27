"use client"

import * as React from "react"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { usePathname } from "next/navigation"

export function SiteHeader() {
  const pathname = usePathname()
  
  // Basic breadcrumb logic
  const segments = pathname.split("/").filter(Boolean)
  const title = segments[0] === "patients" ? "Clinical Index" : "Dashboard"

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) bg-background/50 backdrop-blur-md sticky top-0 z-40">
      <div className="flex w-full items-center gap-2 px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">Clinical Workspace</span>
           <span className="text-primary/20 italic font-light">/</span>
           <h1 className="text-xs font-black uppercase tracking-widest text-foreground">{title}</h1>
        </div>
      </div>
    </header>
  )
}
