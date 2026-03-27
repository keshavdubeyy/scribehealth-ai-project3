"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setLoading(true)
    setError(null)
    try {
      const result = await signIn("credentials", {
        email: values.email,
        password: values.password,
        redirect: false,
      })
      if (result?.error) setError("Invalid credentials.")
      else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (e) {
      setError("Server error.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden border-border bg-card rounded-none shadow-none">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form onSubmit={handleSubmit(onSubmit)} className="p-8 md:p-12 flex flex-col justify-center border-r border-border">
            <div className="flex flex-col items-center gap-2 text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase tracking-widest">Scribe <span className="text-chart-1">Health</span></h1>
              <p className="text-muted-foreground text-xs uppercase font-medium">Access Management Identity</p>
            </div>

            {error && <Alert variant="destructive" className="mb-6 rounded-none"><AlertDescription>{error}</AlertDescription></Alert>}

            <div className="grid gap-6">
              <Field className="grid gap-1.5">
                <FieldLabel htmlFor="email" className="font-bold text-[10px] uppercase text-foreground/60 tracking-widest">User Identity</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@domain.com"
                  className="rounded-none border-border bg-background focus:ring-chart-1 h-11"
                  {...register("email")}
                />
              </Field>

              <Field className="grid gap-1.5">
                <FieldLabel htmlFor="password" className="font-bold text-[10px] uppercase text-foreground/60 tracking-widest">Credential Hash</FieldLabel>
                <Input id="password" type="password" className="rounded-none border-border bg-background focus:ring-chart-1 h-11" {...register("password")} />
              </Field>

              <Button type="submit" className="w-full bg-primary text-primary-foreground font-bold text-xs tracking-[0.2em] rounded-none h-11 mt-2" disabled={loading}>
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "AUTHENTICATE"}
              </Button>
            </div>

            <div className="mt-8 text-center text-xs text-muted-foreground font-medium uppercase tracking-widest">
              No account? <a href="/register" className="text-chart-1 font-bold hover:underline">Register Session</a>
            </div>
          </form>
          <div className="hidden bg-sidebar p-12 md:flex flex-col justify-end text-sidebar-foreground">
            <div className="space-y-4">
              <div className="h-1 w-12 bg-chart-1" />
              <h3 className="text-3xl font-bold leading-tight">Precision Clinical Documentation.</h3>
              <p className="text-sidebar-foreground/60 text-sm leading-relaxed max-w-[300px]">Secure, research-grade medical intelligence optimized for professional practitioners.</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em] py-4">
        Secure &bull; Encrypted &bull; HIPAA Certified
      </div>
    </div>
  )
}
