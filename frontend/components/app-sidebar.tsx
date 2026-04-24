"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { useUserRole } from "@/hooks/use-user-role"
import {
  LayoutDashboard, Users, ClipboardList, LogOut, FileText,
  Stethoscope, ShieldCheck, ScrollText,
} from "lucide-react"
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

const doctorNav = [
  { title: "Dashboard", href: "/patients/dashboard",                       icon: LayoutDashboard },
  { title: "Patients",  href: "/patients",                                 icon: Users           },
  { title: "Sessions",  href: "/patients/sessions",                        icon: FileText        },
  { title: "Templates", href: "/patients/dashboard/prescription-template", icon: ClipboardList   },
]

const adminNav = [
  { title: "Overview",  href: "/patients/dashboard",          icon: LayoutDashboard },
  { title: "Doctors",   href: "/patients/dashboard/doctors",  icon: Stethoscope     },
  { title: "Users",     href: "/patients/dashboard/users",    icon: ShieldCheck     },
  { title: "Audit Log", href: "/patients/dashboard/audit-log",icon: ScrollText      },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname              = usePathname()
  const { data: session }     = useSession()
  const { isAdmin, isLoading } = useUserRole()
  const navItems              = isAdmin ? adminNav : doctorNav

  const userName = session?.user?.name ?? (isAdmin ? "Admin" : "Doctor")
  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  function isActive(href: string) {
    if (href === "/patients/dashboard") return pathname === "/patients/dashboard"
    if (href === "/patients/sessions")  return pathname === "/patients/sessions"
    if (href === "/patients") return (
      pathname === "/patients" ||
      (pathname.startsWith("/patients/") &&
        !pathname.startsWith("/patients/dashboard") &&
        !pathname.startsWith("/patients/sessions"))
    )
    return pathname.startsWith(href)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ── Logo ── */}
      <SidebarHeader className="h-14 flex items-center px-3 border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent px-1">
              <Link href="/patients/dashboard" className="flex items-center gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-white/20 backdrop-blur-sm">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 1C3.686 1 1 3.686 1 7s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 2a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm0 8.5c-1.875 0-3.525-.957-4.5-2.4C2.521 7.645 4.963 7 7 7c2.038 0 4.479.645 4.5 2.1-.975 1.443-2.625 2.4-4.5 2.4z" fill="white"/>
                  </svg>
                </div>
                <span className="text-[13px] font-semibold text-white tracking-tight group-data-[collapsible=icon]:hidden">
                  scribe health
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Role badge ── */}
      <div className="px-4 pt-3 pb-1 group-data-[collapsible=icon]:hidden">
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
          isAdmin
            ? "text-violet-300 bg-violet-500/20"
            : "text-emerald-300 bg-emerald-500/20"
        }`}>
          {isAdmin ? "Admin Portal" : "Clinician"}
        </span>
      </div>

      {/* ── Main nav ── */}
      <SidebarContent className="py-2">
        <SidebarMenu className="gap-0.5 px-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive(item.href)}
                className="h-9 text-white/60 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/20 data-[active=true]:text-white rounded-md transition-colors"
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="size-[15px] shrink-0" />
                  <span className="text-[13px] font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="border-t border-sidebar-border pb-3 pt-2 px-2">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              className="h-9 text-white/60 hover:text-white hover:bg-white/10 rounded-md cursor-pointer transition-colors"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-[15px] shrink-0" />
              <span className="text-[13px] font-medium">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="bg-white/10 my-2" />

        {/* User pill */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={userName}
              className="h-10 hover:bg-white/10 rounded-md cursor-default transition-colors px-2"
            >
              <Avatar className="size-6 shrink-0">
                <AvatarFallback className="bg-white/20 text-white text-[10px] font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0 group-data-[collapsible=icon]:hidden">
                <span className="text-[12px] font-medium text-white truncate leading-tight">{userName}</span>
                <span className={`text-[10px] truncate leading-tight font-semibold ${isAdmin ? "text-violet-300" : "text-white/50"}`}>
                  {isAdmin ? "Administrator" : "Clinician"}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
