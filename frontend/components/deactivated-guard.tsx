"use client"

import * as React from "react"
import { signOut } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ShieldAlert, LogOut, Mail } from "lucide-react"

export function DeactivatedGuard({
  children,
  isActive = true
}: {
  children: React.ReactNode,
  isActive?: boolean
}) {
  const isDeactivated = isActive === false

  return (
    <div className="relative min-h-screen">
      <div className={cn(
        "transition-all duration-700 h-full w-full",
        isDeactivated && "filter blur-sm pointer-events-none select-none grayscale-[0.2]"
      )}>
        {children}
      </div>

      <Dialog open={isDeactivated} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-sm gap-0 p-0 overflow-hidden"
          showCloseButton={false}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
            {/* Icon */}
            <div className="relative flex items-center justify-center">
              <div className="size-16 rounded-full bg-destructive/10 ring-8 ring-destructive/5 flex items-center justify-center">
                <ShieldAlert className="size-7 text-destructive" />
              </div>
            </div>

            {/* Header + badge */}
            <div className="flex flex-col items-center gap-2">
              <Badge variant="destructive" className="text-[10px] uppercase tracking-wider font-semibold px-2.5">
                Access Suspended
              </Badge>
              <DialogHeader className="gap-1.5 items-center">
                <DialogTitle className="text-[1.1rem] leading-snug">Account Deactivated</DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground leading-relaxed max-w-[260px]">
                  Your profile has been deactivated by the system administrator. Full workspace access is restricted.
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Support alert */}
            <Alert className="w-full text-left border-border bg-muted/40">
              <Mail className="text-primary" />
              <AlertTitle className="text-xs font-semibold text-foreground">Administrator Support</AlertTitle>
              <AlertDescription className="text-[11px] leading-relaxed">
                Contact your hospital manager or IT support team to reactivate your credentials.
              </AlertDescription>
            </Alert>
          </div>

          <Separator />

          <DialogFooter className="mx-0 mb-0 p-4 bg-muted/30">
            <Button
              variant="destructive"
              className="w-full gap-2 text-xs font-semibold uppercase tracking-wide"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="size-3.5" />
              Logout of ScribeHealth
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
