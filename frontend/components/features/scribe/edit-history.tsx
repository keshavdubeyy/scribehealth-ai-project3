"use client"

import * as React from "react"
import { History, Clock } from "lucide-react"
import { Session } from "@/lib/mock-store"
import { format } from "date-fns"
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyMedia } from "@/components/ui/empty"

interface EditHistoryProps {
  session: Session
}

export function EditHistory({ session }: EditHistoryProps) {
  const edits = session.edits || []

  if (edits.length === 0) {
    return (
      <Empty className="py-20 bg-muted/20 border-dashed">
        <EmptyMedia variant="icon">
          <History className="size-10 text-muted-foreground/50" />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle className="text-muted-foreground">No edits yet</EmptyTitle>
          <EmptyDescription>
            Changes you make to the clinical note will appear here in chronological order.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          <History className="size-4" />
          Edit History (Last {edits.length})
        </h3>
      </div>
      
      <div className="space-y-4">
        {edits.map((edit, idx) => (
          <div 
            key={idx} 
            className="p-5 rounded-xl bg-card border border-border/50 shadow-sm space-y-3 relative overflow-hidden group hover:border-border transition-colors outline outline-transparent hover:outline-primary/5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary px-2 py-0.5 rounded bg-primary/5">
                {edit.field}
              </span>
              <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="size-3" />
                {format(new Date(edit.timestamp), "d MMM, h:mm:ss aa")}
              </span>
            </div>
            
            <div className="grid gap-3">
              <div className="text-sm text-muted-foreground/60 line-through decoration-muted-foreground/30 pl-3 border-l-2 border-muted-foreground/10 italic">
                {edit.oldValue || "(Empty)"}
              </div>
              <div className="text-sm text-foreground pl-3 border-l-2 border-primary/30">
                {edit.newValue}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
