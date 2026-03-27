"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  UserCircle, 
  Users, 
  LogOut, 
  ShieldCheck,
  Stethoscope
} from "lucide-react"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const routes = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: pathname === "/dashboard"
    },
    ...(role === "DOCTOR" ? [
      {
        label: "My Profile",
        icon: UserCircle,
        href: "/dashboard/profile",
        active: pathname === "/dashboard/profile"
      }
    ] : []),
    ...(role === "ADMIN" ? [
      {
        label: "All Users",
        icon: Users,
        href: "/dashboard/users",
        active: pathname === "/dashboard/users"
      }
    ] : [])
  ]

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen">
      <div className="p-6 flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
          {role === 'ADMIN' ? <ShieldCheck size={20} /> : <Stethoscope size={20} />}
        </div>
        <span className="text-lg font-bold text-white tracking-tight">
          ScribeHealth <span className="text-indigo-400">AI</span>
        </span>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-white/5 hover:text-white",
              route.active ? "bg-white/10 text-white" : "text-slate-400"
            )}
          >
            <route.icon size={18} />
            {route.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-white/5">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-slate-400 hover:text-white hover:bg-white/5 gap-3 h-10 px-3"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={18} />
          Log Out
        </Button>
      </div>
    </aside>
  )
}
