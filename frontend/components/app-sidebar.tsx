"use client"

import * as React from "react"
import { UsersIcon, CommandIcon } from "lucide-react"
import { usePathname } from "next/navigation"
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
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "Dr. Practitioner",
    email: "clinic@scribehealth.ai",
    avatar: "/avatars/doctor.jpg",
  },
  navMain: [
    {
      title: "Patient Directory",
      url: "/patients",
      icon: <UsersIcon />,
      isActive: true,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  // Update activation state based on pathname
  const navItems = data.navMain.map(item => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + "/")
  }))

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/patients">
                <div className="flex aspect-square size-8 items-center justify-center rounded-none bg-primary text-primary-foreground">
                  <CommandIcon className="size-5!" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="text-sm font-black uppercase tracking-widest">Scribe<span className="text-primary italic">Health</span></span>
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">Clinical Intelligence</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
