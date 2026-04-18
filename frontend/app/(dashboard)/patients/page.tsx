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
import { Plus, Search, Trash2, ChevronRight, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
  const router  = useRouter()
  const { patients, fetchPatients, addPatient, deletePatient } = useScribeStore()
  const [mounted,          setMounted]          = React.useState(false)
  const [searchQuery,      setSearchQuery]      = React.useState("")
  const [isAddOpen,        setIsAddOpen]        = React.useState(false)
  const [isDeleteOpen,     setIsDeleteOpen]     = React.useState(false)
  const [patientToDelete,  setPatientToDelete]  = React.useState<string | null>(null)
  const [isSubmitting,     setIsSubmitting]     = React.useState(false)

  React.useEffect(() => { setMounted(true); fetchPatients() }, [fetchPatients])

  const filtered = React.useMemo(() =>
    patients.filter(p =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase())
    ), [patients, searchQuery])

  async function handleAddPatient(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSubmitting(true)
    const fd = new FormData(e.currentTarget)
    try {
      await addPatient({
        name:   fd.get("name")   as string,
        age:    parseInt(fd.get("age") as string),
        gender: fd.get("gender") as string,
      })
      setIsAddOpen(false)
      toast.success("Patient added.")
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error("addPatient error:", err)
      toast.error(msg || "Something went wrong.")
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDelete() {
    if (!patientToDelete) return
    setIsSubmitting(true)
    try {
      await deletePatient(patientToDelete)
      toast.success("Patient deleted.")
      setIsDeleteOpen(false)
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setIsSubmitting(false)
      setPatientToDelete(null)
    }
  }

  const initials = (name: string) =>
    name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-xl font-semibold text-foreground">Patients</h1>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-9"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 justify-center">
                <Plus className="size-4" />
                New patient
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-sm">
              <form onSubmit={handleAddPatient} className="space-y-5">
                <DialogHeader>
                  <DialogTitle>Add patient</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" name="name" placeholder="John Doe" required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="age">Age</Label>
                      <Input id="age" name="age" type="number" placeholder="30" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Input id="gender" name="gender" placeholder="Male" required />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting ? <Loader2 className="animate-spin size-4" /> : "Add patient"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Delete confirmation */}
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
              {isSubmitting ? <Loader2 className="animate-spin size-4" /> : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Table */}
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
