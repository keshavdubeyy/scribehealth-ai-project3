"use client"

import * as React from "react"
import {
  CommandIcon,
  UsersIcon,
} from "lucide-react"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
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

// This is sample data.
const data = {
  user: {
    name: "Dr. Keshav Dubey",
    email: "keshav@scribehealth.ai",
    avatar: "/avatars/doctor.png",
  },
  navMain: [
    {
      title: "Patient Directory",
      url: "/patients",
      icon: <UsersIcon className="size-4" />,
      isActive: true,
    }
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      className="border-r border-sidebar-border"
      {...props}
    >
      <SidebarHeader className="bg-sidebar h-(--header-height) flex items-center justify-center border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="hover:bg-transparent active:bg-transparent px-2 flex items-center justify-center">
              <Link href="/patients">
                <div className="flex aspect-square size-8 items-center justify-center rounded-none bg-foreground text-background shrink-0">
                  <CommandIcon className="size-5" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none ml-3 group-data-[collapsible=icon]:hidden overflow-hidden">
                  <span className="text-sm font-bold tracking-tight text-foreground truncate">ScribeHealth</span>
                  <span className="text-[9px] font-semibold text-muted-foreground/60 uppercase tracking-widest truncate">Clinical Workspace</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar py-4">
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border p-4">
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
