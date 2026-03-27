"use client"

import { Users, LogOut } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut } from "next-auth/react"
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar"

export function Sidebar() {
  const pathname = usePathname()

  const routes = [
    {
      label: "Patients",
      icon: Users,
      href: "/patients",
      active: pathname === "/patients" || pathname.startsWith("/patients/")
    }
  ]

  return (
    <ShadcnSidebar>
      <SidebarHeader className="p-4 border-b border-sidebar-border bg-sidebar/50">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-none bg-primary text-primary-foreground font-black">
            S
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-black uppercase tracking-widest leading-none">
              Scribe<span className="text-primary italic">Health</span>
            </span>
            <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-tight mt-1">
              Clinical Intelligence
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-6 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
            Administrative Protocol
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-2 space-y-1">
              {routes.map((route) => (
                <SidebarMenuItem key={route.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={route.active}
                    className="h-10 px-4 font-bold uppercase tracking-widest text-[11px]"
                  >
                    <Link href={route.href}>
                      <route.icon className="size-4 mr-2" />
                      {route.label}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border bg-sidebar/50">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="h-10 px-4 font-bold uppercase tracking-widest text-[11px] text-muted-foreground hover:text-destructive transition-colors"
            >
              <LogOut className="size-4 mr-2" />
              Terminate Session
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </ShadcnSidebar>
  )
}
