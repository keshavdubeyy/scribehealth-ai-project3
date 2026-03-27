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
import { ConfirmationModal } from "@/components/ui/confirmation-modal"

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
    <div className="space-y-8 max-w-5xl mx-auto">
      <ConfirmationModal 
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
        title="Purge Clinical Record"
        description="Are you sure you want to delete this patient record? This will also remove all historical consultation sessions associated with them. This action is irreversible."
        confirmText="Confirm Purge"
      />

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 uppercase">Patient <span className="text-primary italic">Directory</span></h1>
          <p className="text-sm text-slate-500 font-medium tracking-wide uppercase">Manage and enroll clinical medical records.</p>
        </div>
        
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl font-bold uppercase tracking-tight gap-2 shadow-sm">
              <Plus className="size-4" />
              Create Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-2xl border-slate-200">
            <form onSubmit={handleCreatePatient}>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold uppercase tracking-tight">Enroll <span className="text-primary italic">Patient</span></DialogTitle>
                <DialogDescription className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Provision new clinical medical record into the local index.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-8">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Legal Name</Label>
                  <Input id="name" name="name" placeholder="Johnathan Doe" required disabled={isSubmitting} className="rounded-xl bg-slate-50 border-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="grid gap-2">
                    <Label htmlFor="age" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Age</Label>
                    <Input id="age" name="age" type="number" placeholder="45" required disabled={isSubmitting} className="rounded-xl bg-slate-50 border-slate-200" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="gender" className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Gender</Label>
                    <Select name="gender" required disabled={isSubmitting}>
                      <SelectTrigger className="rounded-xl bg-slate-50 border-slate-200">
                        <SelectValue placeholder="Select Identity" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                        <SelectItem value="MALE">MALE</SelectItem>
                        <SelectItem value="FEMALE">FEMALE</SelectItem>
                        <SelectItem value="OTHER">NON-BINARY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl font-bold uppercase tracking-tight">
                  {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Initiate Record
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {patients.length === 0 ? (
        <div className="h-[400px] rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center bg-white/40 gap-4">
          <div className="p-4 bg-slate-100 rounded-2xl text-slate-400">
             <Plus className="size-8" />
          </div>
          <div className="text-center space-y-1">
            <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">No patients yet</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Create your first patient to begin scribing.</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm animate-in fade-in duration-500">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
              <TableRow>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4 px-6">Practitioner/Identity</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Age</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest py-4">Gender</TableHead>
                <TableHead className="text-right text-[10px] font-bold uppercase tracking-widest py-4 px-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id} className="hover:bg-slate-50/50 transition-colors group cursor-pointer" onClick={() => router.push(`/patients/${patient.id}`)}>
                  <TableCell className="py-4 px-6">
                    <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                           <User className="size-4" />
                        </div>
                        <span className="text-sm font-bold text-slate-900 tracking-tight group-hover:text-primary transition-colors">{patient.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-xs font-semibold text-slate-500">{patient.age} Y/O</TableCell>
                  <TableCell className="py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                      <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200">
                        {patient.gender}
                      </span>
                  </TableCell>
                  <TableCell className="py-4 text-right px-6" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="size-8 p-0 rounded-lg hover:bg-slate-100">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl border-slate-200 shadow-xl">
                        <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-widest text-slate-400 px-3 py-2">Clinical Protocol</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-xs font-bold uppercase tracking-tight gap-2 px-3 py-2.5">
                          <Edit2 className="size-3.5" />
                          Edit Stats
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handleOpenConfirm(patient.id, e)} className="text-xs font-bold uppercase tracking-tight gap-2 px-3 py-2.5 text-destructive focus:text-destructive">
                          <Trash2 className="size-3.5" />
                          Purge Session
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
  )
}
