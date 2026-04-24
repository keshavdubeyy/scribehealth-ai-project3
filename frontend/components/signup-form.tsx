"use client"

import { useState, useEffect, useCallback } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Loader2, Building2, UserPlus, ChevronLeft, CheckCircle2, XCircle } from "lucide-react"

const API = "/api"

type Mode = "choose" | "create_org" | "join_org"
type InviteState = "idle" | "checking" | "valid" | "invalid"

interface OrgInfo { organizationId: string; organizationName: string; organizationType: string }

export function SignupForm({ className, ...props }: React.ComponentProps<"div">) {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [mode,        setMode]        = useState<Mode>("choose")
  const [error,       setError]       = useState<string | null>(null)
  const [loading,     setLoading]     = useState(false)

  // join_org state
  const [inviteCode,  setInviteCode]  = useState("")
  const [inviteState, setInviteState] = useState<InviteState>("idle")
  const [orgInfo,     setOrgInfo]     = useState<OrgInfo | null>(null)

  // pre-fill invite code from ?invite= URL param
  useEffect(() => {
    const code = searchParams.get("invite")
    if (code) {
      setMode("join_org")
      setInviteCode(code.toUpperCase())
    }
  }, [searchParams])

  // auto-validate when invite code comes from URL
  useEffect(() => {
    if (mode === "join_org" && inviteCode.length === 8) {
      validateInvite(inviteCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  const validateInvite = useCallback(async (code: string) => {
    if (code.length < 6) { setInviteState("idle"); setOrgInfo(null); return }
    setInviteState("checking")
    setOrgInfo(null)
    try {
      const res  = await fetch(`${API}/auth/invite/${code.toUpperCase().trim()}`)
      const data = await res.json()
      if (data.valid) {
        setInviteState("valid")
        setOrgInfo({ organizationId: data.organizationId, organizationName: data.organizationName, organizationType: data.organizationType })
      } else {
        setInviteState("invalid")
      }
    } catch {
      setInviteState("invalid")
    }
  }, [])

  const handleCodeChange = (val: string) => {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8)
    setInviteCode(upper)
    setInviteState("idle")
    setOrgInfo(null)
    if (upper.length >= 6) validateInvite(upper)
  }

  async function onSubmit(e: { preventDefault(): void; currentTarget: HTMLFormElement }) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const fd       = new FormData(e.currentTarget)
    const name     = fd.get("name")     as string
    const email    = fd.get("email")    as string
    const password = fd.get("password") as string

    const body: Record<string, string | null> = { mode, name, email, password }

    if (mode === "create_org") {
      body.organizationName = fd.get("organizationName") as string
      body.organizationType = fd.get("organizationType") as string || "clinic"
      body.specialization   = fd.get("specialization")   as string || null
    } else {
      if (inviteState !== "valid") {
        setError("Please enter a valid invite code before continuing.")
        setLoading(false)
        return
      }
      body.inviteCode     = inviteCode
      body.specialization = fd.get("specialization") as string || null
    }

    try {
      const res = await fetch(`${API}/auth/register`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      })

      if (res.ok) {
        const result = await signIn("credentials", { email, password, redirect: false })
        if (result?.error) {
          router.push("/login")
        } else {
          router.push("/patients/dashboard")
        }
      } else {
        const data = await res.json()
        setError(data.message || data.error || "Could not create account. Please try again.")
      }
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  // ── Step 1: choose path ────────────────────────────────────────────────────
  if (mode === "choose") {
    return (
      <div className={cn("flex flex-col gap-6 w-full max-w-sm", className)} {...props}>
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold">Join ScribeHealth</h1>
          <p className="text-sm text-muted-foreground">How would you like to get started?</p>
        </div>

        <div className="grid gap-3">
          <button
            onClick={() => { setMode("create_org"); setError(null) }}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 text-left shadow-sm hover:border-primary/50 hover:bg-primary/[0.02] transition-all group"
          >
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Building2 className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">Create an Organization</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Set up a new clinic or hospital. You&apos;ll become the administrator and can invite doctors.
              </p>
            </div>
          </button>

          <button
            onClick={() => { setMode("join_org"); setError(null) }}
            className="flex items-start gap-4 rounded-xl border border-border bg-card p-5 text-left shadow-sm hover:border-primary/50 hover:bg-primary/[0.02] transition-all group"
          >
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <UserPlus className="size-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">Join with Invite Code</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Have a code from your admin? Enter it to join your organization as a doctor.
              </p>
            </div>
          </button>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    )
  }

  // ── Step 2: shared form ────────────────────────────────────────────────────
  const isCreateOrg = mode === "create_org"

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-sm", className)} {...props}>
      <Card className="border border-border shadow-sm">
        <CardHeader className="pb-4">
          <button
            onClick={() => { setMode("choose"); setError(null) }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-3 transition-colors w-fit"
          >
            <ChevronLeft className="size-3.5" />
            Back
          </button>
          <CardTitle className="text-lg font-semibold">
            {isCreateOrg ? "Create your organization" : "Join your organization"}
          </CardTitle>
          <CardDescription className="text-sm">
            {isCreateOrg
              ? "You'll be the admin. Invite doctors after setup."
              : orgInfo
                ? <span className="flex items-center gap-1.5 text-emerald-700"><CheckCircle2 className="size-3.5" /> Joining <strong>{orgInfo.organizationName}</strong></span>
                : "Enter your invite code to get started."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* ── join_org: invite code ── */}
            {!isCreateOrg && (
              <div className="grid gap-2">
                <Label htmlFor="inviteCode">Invite code</Label>
                <div className="relative">
                  <Input
                    id="inviteCode"
                    value={inviteCode}
                    onChange={e => handleCodeChange(e.target.value)}
                    placeholder="ABC12345"
                    className="font-mono tracking-widest uppercase pr-9"
                    maxLength={8}
                    disabled={loading}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {inviteState === "checking" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                    {inviteState === "valid"    && <CheckCircle2 className="size-4 text-emerald-600" />}
                    {inviteState === "invalid"  && <XCircle className="size-4 text-destructive" />}
                  </div>
                </div>
                {inviteState === "invalid" && (
                  <p className="text-xs text-destructive">Invalid or expired invite code.</p>
                )}
              </div>
            )}

            {/* ── create_org: organization fields ── */}
            {isCreateOrg && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="organizationName">Organization name</Label>
                  <Input id="organizationName" name="organizationName"
                    placeholder="City General Clinic" required disabled={loading} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="organizationType">Organization type</Label>
                  <Select name="organizationType" defaultValue="clinic" disabled={loading}>
                    <SelectTrigger id="organizationType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clinic">Clinic</SelectItem>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="solo_practice">Solo Practice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="border-t border-border/50 pt-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input id="name" name="name" placeholder="Dr. Jane Smith"
                  required disabled={loading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email"
                  placeholder="you@clinic.com" required disabled={loading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password"
                  required disabled={loading} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="specialization">
                  Specialization <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input id="specialization" name="specialization"
                  placeholder="Cardiology" disabled={loading} />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading || (!isCreateOrg && inviteState !== "valid")}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isCreateOrg ? "Create Organization & Account" : "Join Organization"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
