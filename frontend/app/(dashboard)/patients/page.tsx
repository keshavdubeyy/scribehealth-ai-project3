"use client"

import * as React from "react"
import { useScribeStore } from "@/lib/mock-store"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Search, Trash2, ChevronRight } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { AddPatientDialog } from "@/components/features/patients/add-patient-dialog"
import type { PatientFormData } from "@/components/features/patients/add-patient-dialog"

export default function PatientsPage() {
  const router  = useRouter()
  const { patients, fetchPatients, addPatient, deletePatient } = useScribeStore()
  const [mounted,         setMounted]         = React.useState(false)
  const [searchQuery,     setSearchQuery]     = React.useState("")
  const [isAddOpen,       setIsAddOpen]       = React.useState(false)
  const [isDeleteOpen,    setIsDeleteOpen]    = React.useState(false)
  const [patientToDelete, setPatientToDelete] = React.useState<string | null>(null)
  const [isDeleting,      setIsDeleting]      = React.useState(false)

  React.useEffect(() => { setMounted(true); fetchPatients() }, [fetchPatients])

  const filtered = React.useMemo(() =>
    patients.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    ), [patients, searchQuery])

  async function handleAddPatient(data: PatientFormData) {
    await addPatient(data)
    toast.success("Patient added.")
  }

  async function handleDelete() {
    if (!patientToDelete) return
    setIsDeleting(true)
    try {
      await deletePatient(patientToDelete)
      toast.success("Patient deleted.")
      setIsDeleteOpen(false)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsDeleting(false)
      setPatientToDelete(null)
    }
  }

  const initials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  if (!mounted) return null

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      <div className="flex items-start justify-between gap-4">
        <PageHeader />
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-9 h-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <Button
            className="h-10 px-5 font-bold shadow-sm shadow-primary/20 gap-2"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus className="size-4" />
            Add Patient
          </Button>
        </div>
      </div>

      <AddPatientDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onSubmit={handleAddPatient}
      />

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete patient?</AlertDialogTitle>
            <p className="text-sm text-muted-foreground">
              This will permanently delete the patient and all their sessions. This cannot be undone.
            </p>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="animate-spin size-4" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-b border-border">
              <TableHead className="w-[50%]">Name</TableHead>
              <TableHead className="hidden sm:table-cell">Gender</TableHead>
              <TableHead className="hidden sm:table-cell">Age</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-40 text-center text-sm text-muted-foreground">
                  {searchQuery ? "No patients match your search." : "No patients yet. Add your first patient."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(p => (
                <TableRow
                  key={p.id}
                  className="group cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => router.push(`/patients/${p.id}`)}
                >
                  <TableCell className="h-16">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-9 shrink-0">
                        <AvatarFallback className="bg-primary text-white text-xs font-semibold">
                          {initials(p.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{p.gender}</TableCell>
                  <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{p.age} yrs</TableCell>
                  <TableCell className="text-right pr-2 sm:pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all"
                        onClick={e => { e.stopPropagation(); setPatientToDelete(p.id); setIsDeleteOpen(true) }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                      <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
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
