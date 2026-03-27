"use client"

import * as React from "react"
import {
  Search,
  Settings2,
  ListFilter,
  RefreshCw,
  MoreVertical,
} from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useScribeContext } from "@/context/scribe-context"

export function SessionList() {
  const [activeTab, setActiveTab] = React.useState("past")
  const { patients, selectedPatient, sessions, activeSession, selectSession, setSelectedPatient } = useScribeContext()

  // For MVP: if no patient selected but patients exist, select first one
  React.useEffect(() => {
    if (!selectedPatient && patients.length > 0) {
      setSelectedPatient(patients[0])
    }
  }, [patients, selectedPatient, setSelectedPatient])

  // Group sessions by date
  const sessionsByDate = sessions.reduce((acc: any, session: any) => {
    const date = new Date(session.createdAt || Date.now()).toLocaleDateString()
    if (!acc[date]) acc[date] = []
    acc[date].push(session)
    return acc
  }, {})

  return (
    <div className="w-[280px] border-r border-border h-full flex flex-col bg-card">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 text-muted-foreground">
          <span className="text-[10px] font-bold uppercase tracking-widest truncate">{selectedPatient?.name || "No Patient"}</span>
          <div className="flex items-center gap-2">
            <ListFilter size={14} className="cursor-pointer hover:text-foreground" />
            <Settings2 size={14} className="cursor-pointer hover:text-foreground ml-1" />
            <Search size={14} className="cursor-pointer hover:text-foreground ml-1" />
            <RefreshCw size={14} className="cursor-pointer hover:text-foreground ml-1" />
          </div>
        </div>

        <Tabs defaultValue="past" className="w-full" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-md h-9">
            <TabsTrigger value="upcoming" className="text-xs font-bold px-4 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none shadow-none border-none border-b-0">Upcoming</TabsTrigger>
            <TabsTrigger value="past" className="text-xs font-bold px-4 py-1.5 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-none rounded-none shadow-none border-none border-b-0">Past</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-6">
          {Object.entries(sessionsByDate).map(([date, items]: [string, any]) => (
            <div key={date} className="px-4">
              <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{date}</h3>
              <div className="space-y-1">
                {items.map((session: any) => (
                  <div
                    key={session.id}
                    onClick={() => selectSession(session)}
                    className={cn(
                      "group flex items-center gap-3 p-2.5 rounded-md cursor-pointer transition-colors border border-transparent",
                      activeSession?.id === session.id ? "bg-primary text-primary-foreground border-primary/20" : "hover:bg-accent/50 text-foreground"
                    )}
                  >
                    <div className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-bold border",
                      activeSession?.id === session.id ? "bg-primary-foreground/20 border-white/20" : "bg-muted border-border"
                    )}>
                      <MoreVertical size={12} className={cn(activeSession?.id === session.id ? "text-primary-foreground" : "text-muted-foreground")} />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-xs font-bold truncate leading-snug">Untitled session</span>
                      <span className={cn("text-[10px] font-medium leading-tight", activeSession?.id === session.id ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {new Date(session.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {sessions.length === 0 && (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground font-medium opacity-50">
              No sessions found
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border mt-auto">
        <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-xs font-bold text-muted-foreground hover:bg-accent/50" disabled>
          <RefreshCw size={14} />
          Tidy up
        </Button>
      </div>
    </div>
  )
}
