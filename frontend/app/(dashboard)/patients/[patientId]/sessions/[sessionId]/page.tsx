"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { useScribeStore } from "@/lib/mock-store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { 
  ChevronDown,
  Copy,
  FileText,
  MessageSquare,
  MoreHorizontal,
  Share2,
  Clock,
  CalendarDays,
  ArrowLeft,
  User,
  Activity,
  ChevronRight,
  ShieldCheck
} from "lucide-react"
import { toast } from "sonner"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function SessionPage() {
  const { patientId, sessionId } = useParams()
  const router = useRouter()
  const { getPatient, getSessions } = useScribeStore()

  const [mounted, setMounted] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState("note")
  const [soapData, setSoapData] = React.useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  })

  const patient = React.useMemo(() => mounted ? getPatient(patientId as string) : null, [patientId, getPatient, mounted])
  const sessions = React.useMemo(() => mounted ? getSessions(patientId as string) : [], [patientId, getSessions, mounted])
  const session = React.useMemo(() => sessions.find(s => s.id === sessionId), [sessions, sessionId])

  React.useEffect(() => {
    setMounted(true)
    if (session) {
      setSoapData({
        subjective: session.soap?.s || "22 y/o male, no known comorbidities, presented with c/o pain and superficial wounds over right forearm and right knee following minor bike accident ~4 hrs prior to visit. Patient reports slipping at low speed. No h/o loss of consciousness, vomiting, headache, dizziness, chest pain, or abdominal pain. No active bleeding currently. Tetanus immunization status uncertain.",
        objective: "• Vitals: BP 118/76 mmHg, HR 84 bpm, RR 16/min, Temp 98.4°F, SpO₂ 99% RA\n• General: Conscious, oriented, hemodynamically stable\n• Local exam:\n  • Superficial abrasions over right forearm (~4x3 cm) and right knee\n  • Mild tenderness over right ankle, no swelling/deformity\n  • No active bleeding\n  • Distal pulses palpable\n  • ROM preserved\n• No signs of head injury\n• No neuro deficits",
        assessment: "• Superficial soft tissue injury to right forearm and knee.\n• Minor musculoskeletal strain, right ankle.\n• Absence of head trauma or focal neurological deficits.",
        plan: "• Wound cleansing and primary dressing application.\n• Tetanus toxoid booster administered.\n• Symptomatic management with NSAIDs (Ibuprofen 400mg tid).\n• RICE protocol for right ankle.\n• Follow-up in 48 hours for clinical wound review."
      })
    }
  }, [session])

  const handleSoapChange = (key: keyof typeof soapData, value: string) => {
    setSoapData(prev => ({ ...prev, [key]: value }))
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clinical clipboard.")
  }

  if (!mounted || !patient || !session) return null

  const clinicalDescription = "Patient presenting with superficial abrasions and localized pain following a minor bike accident (low-speed slip). Denies loss of consciousness or major trauma. Tetanus status uncertain."

  return (
    <div className="flex flex-col gap-16 max-w-[1440px] animate-in fade-in duration-500 pb-20">
      
      {/* 1. Dashboard Command Bar */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
        <div className="space-y-4">
          <button onClick={() => router.push(`/patients/${patient.id}`)} className="flex items-center gap-2 group text-xs font-bold text-muted-foreground/40 hover:text-foreground transition-all">
            <ArrowLeft className="size-3 group-hover:-translate-x-0.5 transition-transform" />
            Patient Profile
          </button>
          <div className="space-y-1.5">
            <h1 className="text-[32px] font-semibold tracking-tight text-foreground leading-tight lowercase first-letter:uppercase">{patient.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-muted-foreground/60">
              <span className="flex items-center gap-1.5 font-semibold text-foreground/80"><Activity className="size-3.5" /> Urgent Care</span>
              <span className="size-1 rounded-full bg-muted-foreground/10" />
              <span className="flex items-center gap-1.5"><CalendarDays className="size-3.5" /> 2025/09/15</span>
              <span className="size-1 rounded-full bg-muted-foreground/10" />
              <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> 17:55 PM</span>
              <span className="size-1 rounded-full bg-muted-foreground/10" />
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-500/80"><ShieldCheck className="size-3.5" /> Validated</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="h-11 px-6 text-muted-foreground/40 hover:text-foreground border-border font-bold text-xs uppercase tracking-widest transition-all">
             Export PDF
          </Button>
          <Button className="h-11 px-10 bg-foreground text-background hover:bg-foreground/90 font-bold text-xs shadow-sm transition-all">
            <Share2 className="size-4 mr-2.5" />
            Synchronize PMS
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-16 max-w-full">
        {/* 2. Clinical Intelligence Summary */}
        <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4 px-1">
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Clinical Intelligence Summary</span>
            </div>
            <div className="px-1">
                <p className="text-base font-medium text-foreground/80 leading-relaxed max-w-[800px]">
                  {clinicalDescription}
                </p>
            </div>
        </div>

        {/* 3. Product Workspace (Tabs) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col gap-10">
            <div className="flex justify-start border-b border-border/40 pb-1">
              <TabsList className="h-12 bg-transparent border-none p-0 flex gap-8">
                <TabsTrigger 
                  value="note" 
                  className="rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground font-bold text-xs uppercase tracking-widest flex items-center gap-2.5 transition-all text-muted-foreground/40"
                >
                  <FileText className="size-4" />
                  SOAP Protocol
                </TabsTrigger>
                <TabsTrigger 
                  value="transcript" 
                  className="rounded-none border-b-2 border-transparent px-0 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground font-bold text-xs uppercase tracking-widest flex items-center gap-2.5 transition-all text-muted-foreground/40"
                >
                  <MessageSquare className="size-4" />
                  Audio Transcript
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="note" className="mt-0 space-y-12 animate-in slide-in-from-bottom-2 duration-300">
              {/* 4. Protocol Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-11 px-5 font-bold text-[10px] uppercase tracking-widest border-border flex items-center gap-2.5 hover:bg-muted/5 transition-all">
                        Switch Template
                        <ChevronDown className="size-3.5 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="rounded-md p-1 border-border shadow-md">
                       <DropdownMenuItem className="font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 cursor-pointer hover:bg-muted/5 transition-colors">SOAP Primary</DropdownMenuItem>
                       <DropdownMenuItem className="font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 cursor-pointer hover:bg-muted/5 transition-colors">Surgical Report</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-2">
                   <p className="text-[10px] font-bold text-muted-foreground/20 uppercase tracking-widest mr-4">Draft auto-saved</p>
                   <Button variant="ghost" size="icon" className="h-11 w-11 text-foreground/20 hover:text-foreground transition-all">
                     <MoreHorizontal className="size-5" />
                   </Button>
                </div>
              </div>

              {/* 5. Protocol Editor (Simplified & Deep Spacing) */}
              <div className="space-y-16">
                {(Object.keys(soapData) as Array<keyof typeof soapData>).map((key) => (
                   <div key={key} className="space-y-6 group">
                      <div className="flex items-center justify-between border-b border-border/10 pb-4">
                         <span className="text-xl font-semibold tracking-tight text-foreground capitalize">{key}</span>
                         <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => copyToClipboard(soapData[key])}
                            className="h-9 w-9 text-muted-foreground/20 hover:text-foreground transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Copy className="size-4" />
                         </Button>
                      </div>
                      <div className="relative">
                        <Textarea 
                            value={soapData[key]}
                            onChange={(e) => handleSoapChange(key, e.target.value)}
                            className="min-h-[140px] w-full bg-transparent border-none rounded-none focus-visible:ring-0 p-0 text-base font-medium text-foreground/80 leading-relaxed resize-none placeholder:text-muted-foreground/10"
                            placeholder={`Initialize ${key} protocol...`}
                        />
                      </div>
                   </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="transcript" className="mt-0">
               <div className="flex flex-col items-center justify-center py-40 text-center gap-6 border-2 border-dashed border-border/40 rounded-md bg-muted/5 animate-in fade-in duration-700">
                    <div className="size-16 rounded-full bg-foreground/5 flex items-center justify-center">
                        <MessageSquare className="size-8 text-foreground/20" />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-bold text-foreground/40 uppercase tracking-[0.2em]">Archival Logs Locked</p>
                        <p className="text-xs text-muted-foreground/40 font-medium">Verification required to bypass HIPAA identity protection.</p>
                    </div>
               </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
