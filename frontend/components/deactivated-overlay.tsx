"use client"

import * as React from "react"
import { AlertCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { signOut } from "next-auth/react"

interface DeactivatedOverlayProps {
  isActive: boolean
}

export function DeactivatedOverlay({ isActive }: DeactivatedOverlayProps) {
  // If active, do nothing
  if (isActive !== false) return null

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm">
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md border-destructive/20 shadow-2xl [&>button]:hidden">
          <DialogHeader className="flex flex-col items-center text-center space-y-4">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertCircle className="w-8 h-8 text-destructive animate-pulse" />
            </div>
            <DialogTitle className="text-xl font-bold tracking-tight">Account Deactivated</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground leading-relaxed">
              Your profile has been deactivated by the admin. 
              Please contact your administrator to reactivate your profile and regain access to the dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center">
            <Button 
              variant="destructive" 
              className="w-full sm:w-auto px-8 gap-2 font-semibold shadow-lg shadow-destructive/20"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
