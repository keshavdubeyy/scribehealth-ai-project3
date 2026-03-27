"use client"

import { Users, LogOut, LayoutDashboard } from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

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
    <aside className="w-64 h-full bg-white border-r border-slate-200 flex flex-col transition-all duration-300">
      <div className="p-6">
        <div className="flex items-center gap-2 font-bold tracking-tighter text-slate-900 overflow-hidden">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground min-w-7">
            S
          </div>
          <span className="text-sm uppercase tracking-widest truncate">Scribe<span className="font-light italic">Health</span></span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200",
              route.active 
                ? "bg-slate-100 text-primary shadow-sm" 
                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            )}
          >
            <route.icon className={cn("size-4", route.active ? "text-primary" : "text-slate-400")} />
            {route.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 w-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all duration-200"
        >
          <LogOut className="size-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
