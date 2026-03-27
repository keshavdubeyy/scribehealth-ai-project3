"use client"

import * as React from "react"
import { useScribeContext } from "@/context/scribe-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function CreatePatientForm({ onSuccess }: { onSuccess?: () => void }) {
  const { apiBase, token, fetchPatients } = useScribeContext()
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const patientData = {
      name: formData.get("name"),
      age: parseInt(formData.get("age") as string),
      gender: formData.get("gender"),
      contactInfo: formData.get("contact")
    }

    try {
      const res = await fetch(`${apiBase}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(patientData)
      })
      if (res.ok) {
        await fetchPatients()
        onSuccess?.()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm text-left border border-border p-6 rounded-xl bg-card shadow-sm">
      <div className="space-y-1">
        <Label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Patient Name</Label>
        <Input id="name" name="name" placeholder="John Doe" required className="bg-background border-border h-10" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="age" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Age</Label>
          <Input id="age" name="age" type="number" placeholder="45" required className="bg-background border-border h-10" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="gender" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Gender</Label>
          <Select name="gender" defaultValue="Male">
            <SelectTrigger className="bg-background border-border h-10">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="contact" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Contact Info</Label>
        <Input id="contact" name="contact" placeholder="Email or Phone" className="bg-background border-border h-10" />
      </div>
      <Button type="submit" className="w-full bg-primary font-bold h-11" disabled={loading}>
        {loading ? "Creating..." : "Register Patient"}
      </Button>
    </form>
  )
}
