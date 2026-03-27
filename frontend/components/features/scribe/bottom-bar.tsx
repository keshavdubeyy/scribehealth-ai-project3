"use client"

import * as React from "react"
import { Mic, Zap, Edit3, Sparkle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function BottomBar() {
  const [inputValue, setInputValue] = React.useState("")

  return (
    <div className="p-8 pt-2 w-full flex justify-center bg-gradient-to-t from-background to-transparent pointer-events-none sticky bottom-0 z-20">
      <div className="w-full max-w-[800px] flex items-center gap-4 bg-card/80 backdrop-blur-xl border border-border/50 rounded-2xl p-4 shadow-2xl pointer-events-auto group transition-all hover:bg-card hover:border-primary/20">
        <div className="flex aspect-square size-10 items-center justify-center rounded-lg border border-border bg-background transition-colors group-hover:bg-primary/5 group-hover:border-primary/20">
          <Edit3 size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        <div className="flex-1 relative">
          <input
            placeholder="Ask a question or edit your note..."
            className="w-full bg-transparent border-none focus:outline-none text-sm text-foreground font-medium placeholder:text-muted-foreground placeholder:font-normal"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 pr-1">
          <Button variant="outline" className="h-9 gap-2 px-4 text-xs font-bold text-muted-foreground rounded-lg border-border hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all transition-duration-300">
            <Sparkle size={14} className="fill-current text-primary" />
            Prep
          </Button>
          <Button variant="ghost" size="icon" className="size-9 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
            <Mic size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
