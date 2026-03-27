"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Plus, MoreHorizontal, Edit2, Trash2, User, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useScribeStore } from "@/lib/mock-store"
import { toast } from "sonner"

export default function PatientsPage() {
  const router = useRouter()
  const { patients: rawPatients, fetchPatients, addPatient, deletePatient } = useScribeStore()
  
  const [mounted, setMounted] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Confirmation state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [deleteId, setDeleteId] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  React.useEffect(() => {
    setMounted(true)
    fetchPatients()
  }, [fetchPatients])

  const patients = useMemo(() => mounted ? rawPatients : [], [mounted, rawPatients])

  if (!mounted) return null

  async function handleCreatePatient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const age = parseInt(formData.get("age") as string)
    const gender = formData.get("gender") as string

    if (!name || isNaN(age) || !gender) {
       setIsSubmitting(false)
       return
    }

    try {
      const patientId = await addPatient({ name, age, gender })
      toast.success("Patient record initialized in local workspace.")
      setIsModalOpen(false)
      router.push(`/patients/${patientId}`)
    } catch (err) {
      toast.error("Local record initialization failed.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenConfirm = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteId(id)
    setIsConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePatient(deleteId)
      toast.success("Record purged from main cluster.")
    } catch (err) {
      toast.error("Purge operation failed.")
    } finally {
      setIsDeleting(false)
      setIsConfirmOpen(false)
    }
  }

  return (
    <div className="space-y-12 max-w-5xl mx-auto">
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading uppercase tracking-widest text-lg font-black">Purge Clinical Record</AlertDialogTitle>
            <AlertDialogDescription className="text-xs uppercase tracking-[0.15em] font-medium leading-relaxed">
              Are you sure you want to delete this patient record? This will also remove all historical consultation sessions associated with them. This action is irreversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold uppercase tracking-widest text-[10px]">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault()
                handleConfirmDelete()
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive font-black uppercase tracking-widest text-[10px]"
            >
               {isDeleting ? <Loader2 className="size-4 animate-spin" /> : "Confirm Purge"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-end justify-between border-b border-border pb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Patient <span className="text-primary italic">Directory</span></h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none py-1">Manage and enroll clinical medical records.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="font-black uppercase tracking-[0.15em] text-[11px] h-11 px-6 shadow-sm">
              <Plus className="size-4 mr-2" />
              Enroll Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md border-border shadow-none">
            <form onSubmit={handleCreatePatient}>
              <DialogHeader className="mb-8">
                <DialogTitle className="text-lg font-black uppercase tracking-widest">Enroll <span className="text-primary italic">Patient</span></DialogTitle>
                <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                  Provision new clinical medical record into the local index.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-8 py-4">
                <div className="grid gap-2 outline-none">
                  <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Legal Name</Label>
                  <Input id="name" name="name" placeholder="JOHN DOE" required disabled={isSubmitting} className="h-11 bg-muted/20 border-border focus:ring-0 focus:border-primary shadow-none font-bold uppercase" />
                </div>
                <div className="grid grid-cols-2 gap-8">
                   <div className="grid gap-2">
                    <Label htmlFor="age" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Age</Label>
                    <Input id="age" name="age" type="number" placeholder="45" required disabled={isSubmitting} className="h-11 bg-muted/20 border-border focus:ring-0 focus:border-primary shadow-none font-bold" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gender Identity</Label>
                    <Select name="gender" required disabled={isSubmitting}>
                      <SelectTrigger className="h-11 bg-muted/20 border-border focus:ring-0 shadow-none font-bold uppercase">
                        <SelectValue placeholder="Identity" />
                      </SelectTrigger>
                      <SelectContent className="border-border shadow-xl">
                        <SelectItem value="MALE" className="uppercase font-bold text-[10px] tracking-widest">MALE</SelectItem>
                        <SelectItem value="FEMALE" className="uppercase font-bold text-[10px] tracking-widest">FEMALE</SelectItem>
                        <SelectItem value="OTHER" className="uppercase font-bold text-[10px] tracking-widest">NON-BINARY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter className="mt-8 border-t border-border pt-6">
                <Button type="submit" disabled={isSubmitting} className="w-full h-12 font-black uppercase tracking-[0.2em] text-[11px]">
                  {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Initiate Record
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="min-h-[500px]">
        {patients.length === 0 ? (
          <div className="h-[400px] border border-dashed border-border flex flex-col items-center justify-center bg-muted/5 gap-8">
            <div className="relative">
              <Plus className="size-12 text-muted-foreground/20" />
              <div className="absolute inset-0 animate-ping border border-primary/20 scale-150 opacity-0 group-hover:opacity-100" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs font-black text-foreground uppercase tracking-[0.3em] leading-none">No records detected</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-[0.2em] leading-none opacity-50">Create your first patient to begin clinical scribing.</p>
            </div>
          </div>
        ) : (
          <div className="border border-border bg-background shadow-none animate-in fade-in slide-in-from-bottom-2 duration-700">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 px-8 text-foreground/70">Practitioner/Identity</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 px-8 text-foreground/70 text-center">Age Profile</TableHead>
                  <TableHead className="text-[10px] font-black uppercase tracking-widest py-6 px-8 text-foreground/70 text-center">Gender Protocol</TableHead>
                  <TableHead className="text-right text-[10px] font-black uppercase tracking-widest py-6 px-8 text-foreground/70">Protocol Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/30 transition-all group cursor-pointer border-b border-border/50" onClick={() => router.push(`/patients/${patient.id}`)}>
                    <TableCell className="py-8 px-8">
                      <div className="flex items-center gap-4">
                          <div className="size-10 bg-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                             <User className="size-5" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-foreground uppercase tracking-widest group-hover:text-primary transition-colors">{patient.name}</span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1 opacity-50">Legal Clinical Entity</span>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-8 px-8 text-center">
                      <span className="text-xs font-black text-foreground/80 tracking-widest uppercase">{patient.age} Y/O</span>
                    </TableCell>
                    <TableCell className="py-8 px-8 text-center font-bold">
                        <span className="px-3 py-1 bg-muted/50 border border-border text-[9px] uppercase tracking-widest font-black group-hover:bg-background transition-colors">
                          {patient.gender}
                        </span>
                    </TableCell>
                    <TableCell className="py-8 px-8 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="size-10 p-0 border border-transparent hover:border-border hover:bg-muted transition-all">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 border-border shadow-2xl p-2 rounded-none">
                          <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-4 py-3">Clinical Workspace</DropdownMenuLabel>
                          <DropdownMenuSeparator className="bg-border/50" />
                          <DropdownMenuItem className="text-[10px] font-black uppercase tracking-widest gap-3 px-4 py-4 hover:bg-muted transition-colors">
                            <Edit2 className="size-4 text-primary" />
                            Manage Stats
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleOpenConfirm(patient.id, e)} className="text-[10px] font-black uppercase tracking-widest gap-3 px-4 py-4 text-destructive hover:bg-destructive/5 focus:bg-destructive/10 transition-colors">
                            <Trash2 className="size-4" />
                            Purge Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
