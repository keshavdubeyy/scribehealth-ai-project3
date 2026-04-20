"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const profileSchema = z.object({
  specialization: z.string().min(2, "Specialization must be at least 2 characters."),
  licenseNumber: z.string().min(5, "License number must be valid."),
})

export function DoctorProfileForm({ profile, token }: { profile: any, token: string }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      specialization: profile.specialization || "",
      licenseNumber: profile.licenseNumber || "",
    },
  })

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch("/api/doctor/profile", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values),
      })
      if (!res.ok) throw new Error("Failed to update profile.")
      setSuccess("Profile updated successfully!")
    } catch (e: any) {
      setError(e.message || "An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const licenseNum = profile.licenseNumber || profile.license_number
  const spec = profile.specialization
  const isActive = profile.active ?? profile.is_active

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Update Form */}
      <Card className="lg:col-span-2 border border-border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/50 border-b border-border">
          <CardTitle className="text-sm font-semibold text-foreground tracking-tight uppercase">
            Clinical Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <AlertDescription>{success}</AlertDescription>
                  </div>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="specialization"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Medical Specialization</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Cardiology" {...field} />
                    </FormControl>
                    <FormDescription>This will be used for SOAP note templates.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="licenseNumber"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. MED-123456" {...field} />
                    </FormControl>
                    <FormDescription>Your official medical licensure number.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="pt-4 border-t border-border flex items-center justify-end">
                <Button type="submit" className="h-11 px-6 min-w-[140px]" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Profile Overview (Read Only) */}
      <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-muted/50 border-b border-border">
          <CardTitle className="text-sm font-semibold text-foreground tracking-tight uppercase">
            Account Details
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Full Name</Label>
            <p className="text-sm font-semibold text-foreground">{profile.name}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Email Address</Label>
            <p className="text-sm font-semibold text-foreground">{profile.email}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">System Role</Label>
            <Badge variant="secondary">{profile.role}</Badge>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">License Number</Label>
            <p className="text-sm font-semibold text-foreground">{licenseNum || "—"}</p>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Account Status</Label>
            <Badge variant={isActive ? "default" : "destructive"} className={cn(isActive && "bg-emerald-500 hover:bg-emerald-500")}>
              {isActive ? "Verified" : "Unverified"}
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
