"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AudioLines } from "lucide-react"

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["DOCTOR", "ADMIN"]),
  specialization: z.string().optional(),
})

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { role: "DOCTOR" }
  })

  const role = watch("role")

  async function onSubmit(values: z.infer<typeof signupSchema>) {
    setLoading(true)
    setError(null)
    setSuccess(null)
    const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api"
    const body: any = { name: values.name, email: values.email, password: values.password, role: values.role }
    if (values.role === "DOCTOR" && values.specialization) body.doctorProfile = { specialization: values.specialization }

    try {
      const res = await fetch(`${apiBase}/auth/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) throw new Error("Registration failed.")
      setSuccess("Account Enroll Successful. Redirecting...")
      setTimeout(() => router.push("/login"), 2000)
    } catch (e: any) {
      setError(e.message || "Enrollment failed.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border bg-card rounded-none shadow-none">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-12 flex flex-col justify-center border-r border-border bg-card">
            <div className="flex flex-col items-center gap-2 text-center mb-8">
              <div className="flex aspect-square size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
                <AudioLines className="size-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase tracking-widest">Enroll <span className="text-primary">Session</span></h1>
              <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] opacity-60">Provision New Identity</p>
            </div>

            {error && <Alert variant="destructive" className="mb-4 rounded-none border-l-4 border-l-destructive h-auto py-2"><AlertDescription className="text-[10px] font-bold uppercase">{error}</AlertDescription></Alert>}
            {success && <Alert className="mb-4 bg-emerald-50 text-emerald-700 border-emerald-200 border-l-4 border-l-emerald-500 rounded-none h-auto py-2"><AlertDescription className="text-[10px] font-bold uppercase">{success}</AlertDescription></Alert>}

            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="grid gap-1.5 font-bold">
                    <FieldLabel htmlFor="name" className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Full Identity</FieldLabel>
                    <Input id="name" placeholder="Dr. S. Smith" className="rounded-none border-border bg-background focus:ring-0 focus-visible:ring-1 focus-visible:ring-primary h-10 text-sm font-medium" {...register("name")} />
                 </div>
                 <div className="grid gap-1.5">
                    <FieldLabel htmlFor="role" className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Clinical Role</FieldLabel>
                    <Select onValueChange={(val: any) => setValue("role", val)} defaultValue="DOCTOR">
                        <SelectTrigger className="bg-background border-border rounded-none h-10 text-xs font-bold uppercase tracking-widest"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-background border-border rounded-none shadow-2xl">
                            <SelectItem value="DOCTOR" className="text-xs font-bold uppercase tracking-widest">Doctor</SelectItem>
                            <SelectItem value="ADMIN" className="text-xs font-bold uppercase tracking-widest">Admin</SelectItem>
                        </SelectContent>
                    </Select>
                 </div>
              </div>

              <div className="grid gap-1.5">
                <FieldLabel htmlFor="email" className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Comms. Address</FieldLabel>
                <Input id="email" type="email" placeholder="you@clinic.com" className="rounded-none border-border bg-background focus:ring-0 focus-visible:ring-1 focus-visible:ring-primary h-10 text-sm font-medium" {...register("email")} />
              </div>

              <div className="grid gap-1.5">
                <FieldLabel htmlFor="password" className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Identity Pin</FieldLabel>
                <Input id="password" type="password" placeholder="••••••••" className="rounded-none border-border bg-background focus:ring-0 focus-visible:ring-1 focus-visible:ring-primary h-10 text-sm font-medium" {...register("password")} />
              </div>

              {role === "DOCTOR" && (
                <div className="grid gap-1.5">
                  <FieldLabel htmlFor="specialization" className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">Medical Branch</FieldLabel>
                  <Input id="specialization" placeholder="e.g. Cardiology" className="rounded-none border-border bg-background focus:ring-0 focus-visible:ring-1 focus-visible:ring-primary h-10 text-sm font-medium" {...register("specialization")} />
                </div>
              )}

              <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold text-[11px] tracking-[0.25em] rounded-none h-11 mt-2 shadow-xl shadow-primary/10 hover:shadow-primary/20 transition-all uppercase" disabled={loading}>
                {loading ? <Loader2 className="animate-spin size-5" /> : "Deploy Protocol"}
              </Button>
            </div>

            <div className="mt-8 text-center text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
              Already provisioned? <a href="/login" className="text-primary font-bold hover:underline ml-1">Signal Access</a>
            </div>
          </form>
          <div className="hidden relative md:flex flex-col overflow-hidden bg-muted">
             <img 
                src="/api/placeholder/1080/1080" 
                alt="ScribeHealth Visual" 
                className="absolute inset-0 object-cover w-full h-full opacity-90 transition-opacity duration-1000 grayscale hover:grayscale-0"
                style={{ content: `url('/api/media?path=%2FUsers%2Fkeshavdubey%2F.gemini%2Fantigravity%2Fbrain%2Fad1144a2-7140-436e-ba9f-69aed3581914%2Fclinical_scribe_branding_side_panel_1774582261194.png')` }}
             />
             <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent p-12 flex flex-col justify-end text-foreground pointer-events-none">
                <div className="space-y-4">
                   <div className="h-1 w-12 bg-primary" />
                   <h3 className="text-3xl font-extrabold leading-tight tracking-tighter uppercase italic">Unified<br/>Clinical Flow.</h3>
                   <p className="text-foreground/60 text-[11px] font-bold uppercase tracking-widest leading-relaxed max-w-[280px]">Autonomous scribing and structured SOAP generation for modern medicine.</p>
                </div>
             </div>
          </div>
        </CardContent>
      </Card>
       <div className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] py-4">
        Validated Security &bull; Research Grade &bull; HIPAA Certified
      </div>
    </div>
  )
}
