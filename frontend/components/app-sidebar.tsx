"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { LayoutDashboard, Users, FileText, ClipboardList, LogOut, Stethoscope } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const navItems = [
  { title: "Dashboard",  href: "/patients/dashboard", icon: LayoutDashboard },
  { title: "Patients",   href: "/patients",           icon: Users            },
  { title: "Sessions",   href: "/patients/sessions",  icon: FileText         },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/patients/dashboard") return pathname === "/patients/dashboard"
    if (href === "/patients") return pathname === "/patients" || pathname.startsWith("/patients/") && !pathname.startsWith("/patients/dashboard") && !pathname.startsWith("/patients/sessions")
    return pathname.startsWith(href)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Logo */}
      <SidebarHeader className="h-14 flex items-center px-4 border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent">
              <Link href="/patients/dashboard" className="flex items-center gap-3">
                <div className="flex size-7 items-center justify-center rounded-full bg-white/20">
                  <Stethoscope className="size-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-white tracking-tight group-data-[collapsible=icon]:hidden">
                  acribe health
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main nav */}
      <SidebarContent className="py-4">
        <SidebarMenu className="gap-0.5 px-2">
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive(item.href)}
                className="h-9 text-white/70 hover:text-white hover:bg-white/10 data-[active=true]:bg-white/20 data-[active=true]:text-white rounded-md"
              >
                <Link href={item.href} className="flex items-center gap-3">
                  <item.icon className="size-4 shrink-0" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      {/* Footer links */}
      <SidebarFooter className="border-t border-sidebar-border pb-4 pt-2 px-2">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Prescription template"
              className="h-9 text-white/70 hover:text-white hover:bg-white/10 rounded-md"
            >
              <Link href="/patients/dashboard/prescription-template" className="flex items-center gap-3">
                <ClipboardList className="size-4 shrink-0" />
                <span className="text-sm font-medium">Prescription template</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              className="h-9 text-white/70 hover:text-white hover:bg-white/10 rounded-md cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-4 shrink-0" />
              <span className="text-sm font-medium">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
