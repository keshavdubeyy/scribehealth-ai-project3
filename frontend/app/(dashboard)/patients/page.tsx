"use client"

import * as React from "react"
import { useScribeStore } from "@/lib/mock-store"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { 
  Plus, 
  Search, 
  Trash2, 
  ChevronRight,
  Loader2
} from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function PatientsPage() {
  const router = useRouter()
  const { patients, fetchPatients, addPatient, deletePatient } = useScribeStore()
  const [mounted, setMounted] = React.useState(false)
  
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isAddOpen, setIsAddOpen] = React.useState(false)
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = React.useState(false)
  const [patientToDelete, setPatientToDelete] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    fetchPatients()
  }, [fetchPatients])

  const filteredPatients = React.useMemo(() => {
    return patients.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [patients, searchQuery])

  async function handleAddPatient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    const patientData = {
      name: formData.get("name") as string,
      age: parseInt(formData.get("age") as string),
      gender: formData.get("gender") as string,
    }

    try {
      await addPatient(patientData)
      setIsAddOpen(false)
      toast.success("Patient initialized.")
    } catch (err) {
      toast.error("Operation failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteConfirm() {
    if (!patientToDelete) return
    setIsSubmitting(true)
    try {
      await deletePatient(patientToDelete)
      toast.success("Record purged.")
      setIsDeleteAlertOpen(false)
    } catch (err) {
      toast.error("Operation failed.")
    } finally {
      setIsSubmitting(false)
      setPatientToDelete(null)
    }
  }

  const getInitials = (name: string) => {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-16 max-w-[1440px] animate-in fade-in duration-500">
      {/* 1. Dashboard Command Bar */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
        <div className="space-y-2.5">
          <h1 className="text-[32px] font-semibold tracking-tight text-foreground leading-tight">Patient Registry</h1>
          <p className="text-sm font-medium text-muted-foreground/50">Manage clinical records and oversee active session indexes.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-80 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 group-focus-within:text-foreground transition-colors" />
            <Input 
              placeholder="Filter by name or protocol..." 
              className="pl-10 h-11 border-border bg-background focus-visible:ring-1 focus-visible:ring-foreground/10 focus-visible:border-foreground/20 shadow-none text-sm font-medium" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="h-11 px-6 font-semibold text-xs bg-foreground text-background hover:bg-foreground/90 transition-all shadow-sm">
                <Plus className="mr-2.5 size-4" />
                New Protocol
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[420px] rounded-md border-border p-8">
              <form onSubmit={handleAddPatient} className="space-y-8">
                <DialogHeader className="space-y-2.5">
                  <DialogTitle className="text-xl font-semibold tracking-tight">Patient Registration</DialogTitle>
                  <p className="text-sm text-muted-foreground/60 font-medium">Verify legal credentials to initialize the clinical index.</p>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="grid gap-2.5">
                    <Label htmlFor="name" className="text-[10px] font-bold uppercase text-foreground/40 tracking-widest px-0.5">Legal Full Name</Label>
                    <Input id="name" name="name" placeholder="John Doe" className="h-11 border-border bg-muted/5 text-sm font-medium" required />
                  </div>
                  <div className="grid grid-cols-2 gap-5">
                    <div className="grid gap-2.5">
                      <Label htmlFor="age" className="text-[10px] font-bold uppercase text-foreground/40 tracking-widest px-0.5">Verified Age</Label>
                      <Input id="age" name="age" type="number" placeholder="24" className="h-11 border-border bg-muted/5 font-medium" required />
                    </div>
                    <div className="grid gap-2.5">
                      <Label htmlFor="gender" className="text-[10px] font-bold uppercase text-foreground/40 tracking-widest px-0.5">Assigned Gender</Label>
                      <Input id="gender" name="gender" placeholder="Male" className="h-11 border-border bg-muted/5 font-medium" required />
                    </div>
                  </div>
                </div>
                
                <DialogFooter className="pt-4">
                  <Button type="submit" disabled={isSubmitting} className="h-11 w-full font-bold text-xs bg-foreground text-background hover:bg-foreground/90 transition-all">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : "Verify & Initialize"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent className="rounded-md border-border p-8">
          <AlertDialogHeader className="space-y-2">
             <AlertDialogTitle className="text-xl font-semibold tracking-tight">System Confirmation</AlertDialogTitle>
             <p className="text-sm text-muted-foreground/60 font-medium">Are you certain you wish to purge this patient record? This operation is irreversible.</p>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-4">
            <AlertDialogCancel className="h-11 px-6 text-xs font-bold uppercase tracking-widest border-border hover:bg-muted/5 transition-all">Abort</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="h-11 px-6 bg-destructive text-destructive-foreground font-bold text-xs uppercase tracking-widest hover:opacity-90 transition-all">{isSubmitting ? <Loader2 className="animate-spin" /> : "Confirm Purge"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2. Clinical Index Table */}
      <div className="space-y-10">
        <Table>
          <TableCaption className="mt-12 text-[11px] font-medium text-muted-foreground/20 uppercase tracking-[0.2em]">End of clinical registry</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border/40 overflow-hidden">
              <TableHead className="w-[450px]">Identity</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Age</TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPatients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center text-xs font-semibold text-muted-foreground/20 italic">
                  No records detected in indices.
                </TableCell>
              </TableRow>
            ) : (
              filteredPatients.map((p) => (
                <TableRow key={p.id} className="group hover:bg-muted/5 cursor-pointer transition-colors" onClick={() => router.push(`/patients/${p.id}`)}>
                  <TableCell className="font-medium h-20">
                    <div className="flex items-center gap-4">
                      <div className="size-10 bg-foreground flex items-center justify-center text-background font-bold font-mono text-[11px] rounded-md shadow-sm">
                        {getInitials(p.name)}
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold tracking-tight leading-none">{p.name}</p>
                        <p className="text-[11px] font-medium text-muted-foreground/40 font-mono tracking-tighter">{p.id.toUpperCase()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{p.gender}</TableCell>
                  <TableCell className="text-sm font-medium">{p.age} Y/O</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-3 transition-all">
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/40 hover:text-destructive transition-all opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); setPatientToDelete(p.id); setIsDeleteAlertOpen(true) }}>
                          <Trash2 className="size-4" />
                        </Button>
                        <ChevronRight className="size-4 text-muted-foreground/20 group-hover:text-primary transition-all" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
