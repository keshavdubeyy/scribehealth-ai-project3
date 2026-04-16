import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <TooltipProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "14rem",
            "--header-height": "calc(var(--spacing) * 11)",
          } as React.CSSProperties
        }
      >
        <div className="flex min-h-screen w-full">
          <AppSidebar variant="sidebar" collapsible="icon" className="border-r border-border" />
          <SidebarInset className="bg-background">
            <SiteHeader />
            <main className="flex flex-1 flex-col overflow-hidden">
              <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex flex-col gap-6 py-6 px-8 lg:px-10 w-full animate-in fade-in duration-300">
                  {children}
                </div>
              </div>
            </main>
          </SidebarInset>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  )
}
