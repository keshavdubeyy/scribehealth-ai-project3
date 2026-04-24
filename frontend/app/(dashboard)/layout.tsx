import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { StoreInitializer } from "@/components/store-initializer"
import { DeactivatedOverlay } from "@/components/deactivated-overlay"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const isActive = (session?.user as any)?.isActive ?? true

  return (
    <TooltipProvider>
      <DeactivatedOverlay isActive={isActive} />
      <StoreInitializer email={session.user?.email ?? ""} />
      <SidebarProvider
        style={
          {
            "--sidebar-width": "14rem",
            "--header-height": "calc(var(--spacing) * 11)",
          } as React.CSSProperties
        }
      >
        <div className="flex min-h-screen w-full">
          <AppSidebar collapsible="icon" />
          <SidebarInset className="bg-[#F7F6F5]">
            <SiteHeader />
            <main className="flex flex-1 flex-col overflow-hidden">
              <div className="flex flex-1 flex-col overflow-y-auto">
                <div className="flex flex-col py-8 px-6 sm:px-10 lg:px-12 w-full animate-in fade-in duration-300">
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
