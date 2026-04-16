"use client"

import { LoginForm } from "@/components/login-form"
import { Stethoscope } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background p-6">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex items-center gap-2 self-center">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary">
            <Stethoscope className="size-4 text-white" />
          </div>
          <span className="text-lg font-semibold text-foreground tracking-tight">acribe health</span>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
