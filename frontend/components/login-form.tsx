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
import { Loader2 } from "lucide-react"

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
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("An unexpected authentication error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="rounded-xl border-slate-200 shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold tracking-tight uppercase">Authorize <span className="text-primary italic">Protocol</span></CardTitle>
          <CardDescription>
            Enter your clinical credentials to access the scribe core.
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
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Clinical Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@scribehealth.ai"
                  required
                  disabled={loading}
                  className="rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-primary"
                />
              </div>

              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Security Pin</Label>
                </div>
                <Input 
                  id="password" 
                  name="password" 
                  type="password" 
                  required 
                  disabled={loading}
                  className="rounded-lg bg-slate-50 border-slate-200 focus-visible:ring-primary"
                />
              </div>
              
              <Button type="submit" className="w-full rounded-lg font-bold uppercase tracking-tight" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Authorize Session
              </Button>
            </div>
            
            <div className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="/register" className="underline underline-offset-4 font-semibold text-primary">
                Enroll Session
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
      <p className="px-8 text-center text-xs text-muted-foreground leading-relaxed">
        By continuing, you verify protocol adherence to our <a href="#" className="underline font-medium">Terms</a> and <a href="#" className="underline font-medium">Data Privacy</a>.
      </p>
    </div>
  )
}
