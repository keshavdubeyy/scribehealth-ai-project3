"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ArrowRight } from "lucide-react"

export function LoginForm({
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
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or security pin.")
      } else {
        router.push("/patients") // Redirect to patients directory
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected authentication error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-8", className)} {...props}>
      <Card className="rounded-none border-border bg-background shadow-none animate-in fade-in slide-in-from-bottom-4 duration-700">
        <CardHeader className="text-center pb-10">
          <CardTitle className="text-2xl font-black tracking-tighter uppercase leading-none">Authorize <span className="text-primary italic">Protocol</span></CardTitle>
          <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-2 opacity-50">
            Provision clinical credentials for index access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-10">
            <div className="grid gap-6">
              {error && (
                <Alert variant="destructive" className="rounded-none border-destructive/20 bg-destructive/5 py-4">
                  <AlertDescription className="text-[9px] font-black uppercase tracking-[0.2em]">{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="grid gap-3">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Clinical Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="NAME@SCRIBEHEALTH.AI"
                  required
                  disabled={loading}
                  className="rounded-none bg-muted/5 border-border focus-visible:ring-0 focus-visible:border-primary h-12 text-xs font-bold uppercase tracking-widest px-4 shadow-none"
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1">Security Pin</Label>
                </div>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  placeholder="****"
                  required 
                  disabled={loading}
                  className="rounded-none bg-muted/5 border-border focus-visible:ring-0 focus-visible:border-primary h-12 text-xs font-bold uppercase tracking-widest px-4 shadow-none"
                />
              </div>
              
              <Button type="submit" className="w-full rounded-none h-14 font-black uppercase tracking-[0.3em] text-[11px] mt-2 shadow-none group" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="size-4 mr-2 group-hover:translate-x-1 transition-transform" />}
                Authorize Session
              </Button>
            </div>
            
            <div className="text-center border-t border-border pt-8">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-50">New Practitioner?</span>{" "}
              <a href="#" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline underline-offset-4 ml-1">
                Enroll Protocol
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="px-10 space-y-4">
        <p className="text-center text-[9px] text-muted-foreground font-bold uppercase tracking-widest leading-relaxed opacity-30">
          PROVISIONING OF CLINICAL CREDENTIALS VERIFIES COMPLIANCE WITH THE SCRIBEHEALTH <a href="#" className="underline hover:text-foreground">DATA PROTOCOL</a>.
        </p>
      </div>
    </div>
  )
}
