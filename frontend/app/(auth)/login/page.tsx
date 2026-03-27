"use client"

import { LoginForm } from "@/components/login-form"
import { CommandIcon } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-10 bg-background p-10">
      <div className="flex w-full max-w-sm flex-col gap-8">
        <div className="flex items-center gap-4 self-center group">
          <div className="flex size-10 items-center justify-center rounded-none bg-primary text-primary-foreground group-hover:bg-foreground transition-all duration-500">
            <CommandIcon className="size-6" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black uppercase tracking-widest leading-none">Scribe<span className="text-primary italic">Health</span></span>
            <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-[0.2em]">Clinical Intelligence</span>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
