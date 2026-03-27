"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const role = formData.get("role") as string

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8081/api"
      const res = await fetch(`${apiBase}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      })

      if (res.ok) {
        router.push("/login")
      } else {
        const data = await res.json()
        setError(data.message || "Enrollment failed. Please verify clinical credentials.")
      }
    } catch (err) {
      setError("Network error: Verification protocol failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold tracking-tight uppercase">Protocol <span className="text-primary italic">Enrollment</span></CardTitle>
          <CardDescription>
            Join the clinical scribe network as a doctor or system admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4">
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertDescription className="text-xs font-semibold uppercase">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Practitioner Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Dr. John Doe"
                  required
                  disabled={loading}
                  className="rounded-lg bg-slate-50 border-slate-200"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Clinical Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@scribehealth.ai"
                  required
                  disabled={loading}
                  className="rounded-lg bg-slate-50 border-slate-200"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Security Pin</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    required 
                    disabled={loading}
                    className="rounded-lg bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Access Role</Label>
                  <Select name="role" defaultValue="DOCTOR" disabled={loading}>
                    <SelectTrigger className="rounded-lg bg-slate-50 border-slate-200">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCTOR">Doctor</SelectItem>
                      <SelectItem value="ADMIN">Administrator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button type="submit" className="w-full rounded-lg font-bold uppercase tracking-tight" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Provision Access
              </Button>
            </div>
            
            <div className="text-center text-sm">
              Already enrolled?{" "}
              <a href="/login" className="underline underline-offset-4 font-semibold text-primary">
                Authorize Access
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="px-8 text-center text-xs text-muted-foreground leading-relaxed">
        By enrolling, you certify professional standing and adherence to our <a href="#" className="underline font-medium">Data Privacy Charter</a>.
      </p>
    </div>
  )
}
