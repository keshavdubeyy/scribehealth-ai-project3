"use client"

import * as React from "react"
import {
  AudioLines,
  BookOpen,
  ClipboardList,
  Compass,
  FileText,
  HelpCircle,
  LayoutGrid,
  Library,
  MessageSquare,
  Plus,
  Settings,
  Users,
  Bell,
  PanelLeft,
  ChevronRight,
  Gift,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuBadge,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

import { useSession } from "next-auth/react"

export function ScribeSidebar() {
  const { toggleSidebar, state } = useSidebar()
  const { data: session } = useSession()
  const user = session?.user

  return (
    <Sidebar className="border-r border-border bg-sidebar" collapsible="icon">
      <SidebarHeader className="p-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <AudioLines className="size-5" />
          </div>
          <span className="font-bold text-lg tracking-tight">Heidi</span>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={toggleSidebar}>
          <PanelLeft className="size-4" />
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-3">
        {/* New Session Button */}
        <div className="py-4 group-data-[collapsible=icon]:px-0">
          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-md h-10 gap-2 font-bold shadow-none group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:p-0">
            <Plus className="size-4" />
            <span className="group-data-[collapsible=icon]:hidden">New session</span>
          </Button>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive size="lg" className="bg-sidebar-accent shadow-none border border-border/50">
                  <AudioLines className="size-5" />
                  <span className="font-bold">Scribe</span>
                  <SidebarMenuBadge className="group-data-[collapsible=icon]:hidden ml-auto">
                    <ChevronRight size={14} />
                  </SidebarMenuBadge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <Compass className="size-5" />
                  <span>Evidence</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <ClipboardList className="size-5" />
                  <span>Tasks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <MessageSquare className="size-5" />
                  <span>Comms</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">My Library</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <Library className="size-5" />
                  <span>My Templates</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Community</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <LayoutGrid className="size-5" />
                  <span>Templates</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <Users className="size-5" />
                  <span>Team</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <Settings className="size-5" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-4">
        <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-lg group-data-[collapsible=icon]:hidden">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="size-4 text-primary" />
            <span className="text-xs font-bold text-primary">Earn 14 free days</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-tight">Share ScribeHealth with colleagues.</p>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <HelpCircle className="size-5" />
              <span>Help</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Bell className="size-5" />
              <span>Notifications</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <Separator className="my-2 bg-border/50" />
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-auto py-2">
              <Avatar className="size-8 rounded-lg">
                <AvatarImage src={user?.image || ""} />
                <AvatarFallback className="rounded-lg bg-indigo-100 text-indigo-700 font-bold">
                  {user?.name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-0.5 ml-2 overflow-hidden group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-bold truncate">{user?.name || "User"}</span>
                <span className="text-[10px] text-muted-foreground truncate">{user?.email || "No email"}</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full", className)} />
}
