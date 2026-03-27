"use client"

import { SignupForm } from "@/components/signup-form"
import { AudioLines } from "lucide-react"

export default function RegisterPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-slate-50 p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-bold tracking-tighter text-slate-900 group">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground group-hover:bg-slate-800 transition-colors duration-300">
            <AudioLines className="size-5" />
          </div>
          <span className="text-lg uppercase -tracking-wider">Scribe<span className="font-light italic">Health</span></span>
        </div>
        <SignupForm />
      </div>
    </div>
  )
}
