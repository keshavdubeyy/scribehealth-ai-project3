"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle, Loader2 } from "lucide-react"

interface ConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  isLoading?: boolean
  variant?: "destructive" | "default"
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Continue",
  isLoading = false,
  variant = "destructive"
}: ConfirmationModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="size-16 rounded-3xl bg-destructive/10 flex items-center justify-center text-destructive animate-in zoom-in-50 duration-500">
               <AlertTriangle className="size-8" />
            </div>
            <div className="space-y-2">
               <DialogTitle className="text-xl font-black uppercase tracking-tight leading-none pt-2">
                 {title}
               </DialogTitle>
               <DialogDescription className="text-xs font-medium text-slate-400 uppercase tracking-widest leading-relaxed px-4">
                 {description}
               </DialogDescription>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button 
                onClick={onConfirm} 
                disabled={isLoading}
                variant={variant === "destructive" ? "destructive" : "default"}
                className="w-full h-12 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-destructive/20"
            >
              {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4 mr-2" />}
              {confirmText}
            </Button>
            <Button 
                onClick={onClose} 
                variant="ghost" 
                className="w-full h-12 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              Cancel
            </Button>
          </div>
        </div>
        
        {/* Subtle decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-destructive/20" />
      </DialogContent>
    </Dialog>
  )
}
