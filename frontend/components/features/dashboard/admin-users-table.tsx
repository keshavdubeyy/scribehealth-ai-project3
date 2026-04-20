"use client"

/**
 * Admin Users Table — uses AdminFacade (Facade Pattern) for all API calls.
 *
 * No raw fetch() calls exist here.  All backend communication goes through
 * AdminFacade, which centralises the API base URL, auth headers, and error
 * handling in one place.
 */

import * as React from "react"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, CheckCircle2, Loader2, UserPlus } from "lucide-react"
import { AdminFacade, type CreateUserRequest, type UserSummary } from "@/lib/admin-facade"

// ── Component ────────────────────────────────────────────────────────────────

export function AdminUsersTable({ initialUsers, token }: { initialUsers: UserSummary[], token: string }) {
  const facade = new AdminFacade(token)

  const [users,   setUsers]   = useState<UserSummary[]>(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)

  // ── Activate / Deactivate ─────────────────────────────────────────────────

  const toggleUser = async (userId: string, activate: boolean) => {
    setLoading(userId)
    try {
      // ✅ AdminFacade — not a raw fetch()
      await facade.toggleUserActivation(userId, activate)
      setUsers((prev: UserSummary[]) =>
        prev.map((u: UserSummary) => u.id === userId ? { ...u, active: activate } : u)
      )
    } catch (err) {
      console.error(err)
      alert(`Failed to ${activate ? "activate" : "deactivate"} user: ${err instanceof Error ? err.message : "Unknown error"}`)
    } finally {
      setLoading(null)
    }
  }

  // ── Create User ───────────────────────────────────────────────────────────

  const [isCreateOpen,  setIsCreateOpen]  = useState(false)
  const [isCreating,    setIsCreating]    = useState(false)
  const [createError,   setCreateError]   = useState<string | null>(null)

  const [newUser, setNewUser] = useState<CreateUserRequest>({
    name: "", email: "", password: "", role: "DOCTOR",
  })

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreating(true)
    setCreateError(null)
    try {
      // ✅ AdminFacade — not a raw fetch()
      const created = await facade.createUser(newUser)
      setUsers((prev: UserSummary[]) => [created, ...prev])
      setIsCreateOpen(false)
      setNewUser({ name: "", email: "", password: "", role: "DOCTOR" })
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create user")
    } finally {
      setIsCreating(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Card className="border border-border shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="bg-muted/50 border-b border-border flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-foreground tracking-tight uppercase">
          All Users
        </CardTitle>

        {/* ── Create User Dialog ── */}
        <Dialog open={isCreateOpen} onOpenChange={(open: boolean) => { setIsCreateOpen(open); setCreateError(null) }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2 h-8 text-xs font-semibold">
              <UserPlus className="w-3.5 h-3.5" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <form onSubmit={handleCreate} className="space-y-5">
              <DialogHeader>
                <DialogTitle>Create new user</DialogTitle>
              </DialogHeader>

              {createError && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
                  {createError}
                </p>
              )}

              <div className="space-y-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="cu-name">Full name</Label>
                  <Input
                    id="cu-name"
                    placeholder="Dr. Jane Smith"
                    required
                    value={newUser.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewUser((p: CreateUserRequest) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="cu-email">Email</Label>
                  <Input
                    id="cu-email"
                    type="email"
                    placeholder="jane@hospital.com"
                    required
                    value={newUser.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewUser((p: CreateUserRequest) => ({ ...p, email: e.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="cu-password">Temporary password</Label>
                  <Input
                    id="cu-password"
                    type="password"
                    placeholder="Min. 8 characters"
                    required
                    minLength={8}
                    value={newUser.password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setNewUser((p: CreateUserRequest) => ({ ...p, password: e.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="cu-role">Role</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(v: string) =>
                      setNewUser((p: CreateUserRequest) => ({ ...p, role: v as "DOCTOR" | "ADMIN" }))
                    }
                  >
                    <SelectTrigger id="cu-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DOCTOR">Doctor</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" type="button" onClick={() => setIsCreateOpen(false)} disabled={isCreating}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating} className="gap-2">
                  {isCreating
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Creating…</>
                    : "Create user"
                  }
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground font-medium">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((u: UserSummary) => (
                <TableRow key={u.id}>
                  <TableCell className="pl-6 font-semibold py-4">{u.name}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`font-bold text-[10px] tracking-widest ${
                        u.role === "ADMIN"
                          ? "text-destructive border-destructive/20 bg-destructive/5"
                          : "text-primary border-primary/20 bg-primary/5"
                      }`}
                    >
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {u.active ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-medium text-sm">
                          <CheckCircle2 size={14} />
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-sm">
                          <AlertCircle size={14} />
                          Inactive
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </TableCell>
                  <TableCell className="pr-6 text-right">
                    {u.active ? (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs font-semibold px-3"
                        onClick={() => toggleUser(u.id, false)}
                        disabled={loading === u.id}
                      >
                        {loading === u.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : "Deactivate"
                        }
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs font-semibold px-3 border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700"
                        onClick={() => toggleUser(u.id, true)}
                        disabled={loading === u.id}
                      >
                        {loading === u.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : "Activate"
                        }
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
