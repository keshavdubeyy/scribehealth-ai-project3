"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertCircle, CheckCircle2, Plus, Loader2, ShieldCheck, Stethoscope, Copy, Trash2, RefreshCw, Link2, Pencil, MoreHorizontal } from "lucide-react"

const API = "/api"

interface Organization { id: string; name: string; type: string }
interface Invite {
  id: string; code: string; organizationId: string; createdByEmail: string
  expiresAt: string | null; maxUses: number; useCount: number
  isActive: boolean; isUsable: boolean; createdAt: string
}
interface User {
  id: string; name: string; email: string; role: string
  active: boolean; organizationId?: string; createdAt?: string; lastLoginAt?: string
}

export function AdminUsersTable({
  initialUsers,
  organizations: _organizations,
  initialInvites,
  token,
}: {
  initialUsers: User[]
  organizations: Organization[]
  initialInvites: Invite[]
  token: string
}) {
  const [users, setUsers]           = useState<User[]>(initialUsers)
  const [invites, setInvites]       = useState<Invite[]>(initialInvites)
  const [loading, setLoading]       = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [creating, setCreating]     = useState(false)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied]         = useState<string | null>(null)
  const [editUser, setEditUser]     = useState<User | null>(null)
  const [editName, setEditName]     = useState("")
  const [editSaving, setEditSaving] = useState(false)

  // ── edit doctor name ──────────────────────────────────────────
  const openEdit = (u: User) => { setEditUser(u); setEditName(u.name) }

  const saveEdit = async () => {
    if (!editUser || !editName.trim()) return
    setEditSaving(true)
    try {
      const res = await fetch(`${API}/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      })
      if (!res.ok) throw new Error()
      const updated: User = await res.json()
      setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, name: updated.name } : u))
      setEditUser(null)
    } catch {
      alert("Failed to update name.")
    } finally {
      setEditSaving(false)
    }
  }

  // ── invite management ─────────────────────────────────────────
  const generateInvite = async () => {
    setGenerating(true)
    try {
      const res = await fetch(`${API}/admin/invites`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ expiryDays: 7 }),
      })
      if (!res.ok) throw new Error()
      const created: Invite = await res.json()
      setInvites(prev => [created, ...prev])
    } catch {
      alert("Failed to generate invite code.")
    } finally {
      setGenerating(false)
    }
  }

  const revokeInvite = async (code: string) => {
    try {
      const res = await fetch(`${API}/admin/invites/${code}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error()
      setInvites(prev => prev.map(i => i.code === code ? { ...i, isActive: false, isUsable: false } : i))
    } catch {
      alert("Failed to revoke invite.")
    }
  }

  const copyInvite = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  // ── activate / deactivate ──────────────────────────────────────
  const toggleUser = async (userId: string, activate: boolean) => {
    setLoading(userId)
    try {
      const res = await fetch(`${API}/admin/users/${userId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ active: activate }),
      })
      if (!res.ok) throw new Error()
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: activate } : u))
    } catch {
      alert("Failed to update user status.")
    } finally {
      setLoading(null)
    }
  }

  // ── promote / demote role ──────────────────────────────────────
  const changeRole = async (userId: string, newRole: string) => {
    setLoading(userId + "_role")
    try {
      const res = await fetch(`${API}/admin/users/${userId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      })
      if (!res.ok) throw new Error()
      const updated: User = await res.json()
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: updated.role } : u))
    } catch {
      alert("Failed to update role.")
    } finally {
      setLoading(null)
    }
  }

  // ── create doctor ──────────────────────────────────────────────
  const handleCreate = async (e: { preventDefault(): void; currentTarget: HTMLFormElement }) => {
    e.preventDefault()
    setCreating(true)
    setCreateError(null)
    const fd = new FormData(e.currentTarget)
    const body = {
      name:           fd.get("name"),
      email:          fd.get("email"),
      password:       fd.get("password"),
      organizationId: fd.get("organizationId") || null,
      specialization: fd.get("specialization") || null,
      licenseNumber:  fd.get("licenseNumber")  || null,
    }
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        setCreateError(data.message || "Failed to create account.")
        return
      }
      const created: User = await res.json()
      setUsers(prev => [created, ...prev])
      setCreateOpen(false)
    } catch {
      setCreateError("Network error. Please try again.")
    } finally {
      setCreating(false)
    }
  }

  const pending = users.filter(u => !u.active)
  const active  = users.filter(u => u.active)

  return (
    <div className="space-y-6">
      {/* Pending activation */}
      {pending.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/10 shadow-none overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-amber-200/50 py-3 px-6 bg-amber-50/50">
            <CardTitle className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Pending Activation
            </CardTitle>
            <Badge variant="outline" className="bg-amber-100/50 text-amber-700 border-amber-200 text-[10px] h-5">{pending.length}</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <UsersTable
              users={pending}
              loading={loading}
              onToggle={toggleUser}
              onRoleChange={changeRole}
              onEdit={openEdit}
              token={token}
            />
          </CardContent>
        </Card>
      )}

      {/* Active users */}
      <Card className="shadow-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b py-3 px-6 bg-muted/30">
          <div className="flex items-center gap-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Users
            </CardTitle>
            <Badge variant="secondary" className="text-[10px] h-5">{active.length}</Badge>
          </div>
          <Button
            size="sm"
            className="h-8 font-bold gap-1.5"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="size-3.5" />
            Add Doctor
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <UsersTable
            users={active}
            loading={loading}
            onToggle={toggleUser}
            onRoleChange={changeRole}
            onEdit={openEdit}
            token={token}
          />
        </CardContent>
      </Card>

      {/* Invite codes */}
      <Card className="shadow-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b py-3 px-6 bg-muted/30">
          <div className="flex items-center gap-2">
            <Link2 className="size-3.5 text-muted-foreground" />
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Invite Codes
            </CardTitle>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="text-xs font-bold gap-1.5 hover:bg-muted"
            onClick={generateInvite}
            disabled={generating}
          >
            {generating ? <Loader2 className="size-3 animate-spin" /> : <RefreshCw className="size-3" />}
            Generate New
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {invites.length === 0 ? (
            <p className="text-center py-10 text-sm text-muted-foreground font-medium">No invite codes yet. Generate one to invite doctors.</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="pl-6 text-[10px] uppercase font-bold tracking-widest h-10">Code</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest h-10">Uses</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest h-10">Expires</TableHead>
                  <TableHead className="text-[10px] uppercase font-bold tracking-widest h-10">Status</TableHead>
                  <TableHead className="pr-6 text-right text-[10px] uppercase font-bold tracking-widest h-10">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map(inv => (
                  <TableRow key={inv.id} className={!inv.isActive ? "opacity-50" : "hover:bg-muted/30"}>
                    <TableCell className="pl-6 font-mono font-bold tracking-widest text-xs">{inv.code}</TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {inv.maxUses === 0 ? `${inv.useCount} used` : `${inv.useCount} / ${inv.maxUses}`}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {inv.expiresAt
                        ? format(new Date(inv.expiresAt), "MMM d, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.isUsable ? "default" : "secondary"} className={`text-[10px] font-bold h-5 px-1.5 ${inv.isUsable ? "bg-emerald-500 hover:bg-emerald-600" : "bg-muted text-muted-foreground"}`}>
                        {inv.isUsable ? "Active" : "Revoked"}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost" size="sm"
                          className="px-2 text-[11px] font-bold gap-1.5 hover:bg-muted"
                          onClick={() => copyInvite(inv.code)}
                          disabled={!inv.isUsable}
                        >
                          {copied === inv.code
                            ? <><CheckCircle2 className="size-3 text-emerald-600" /> Copied</>
                            : <><Copy className="size-3" /> Copy</>}
                        </Button>
                        {inv.isActive && (
                          <Button
                            variant="ghost" size="sm"
                            className="px-2 text-[11px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 font-bold"
                            onClick={() => revokeInvite(inv.code)}
                          >
                            <Trash2 className="size-3" /> Revoke
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <Dialog open={!!editUser} onOpenChange={v => { if (!v) setEditUser(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Edit Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="editName" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Full Name</Label>
              <Input
                id="editName"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="Dr. Jane Smith"
                disabled={editSaving}
                className="h-10"
              />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="ghost" className="h-9 px-4 font-bold" onClick={() => setEditUser(null)} disabled={editSaving}>
                Cancel
              </Button>
              <Button className="h-9 px-4 font-bold" onClick={saveEdit} disabled={editSaving || !editName.trim()}>
                {editSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={v => { setCreateOpen(v); setCreateError(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">New Doctor Account</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-5 pt-4">
            {createError && (
              <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/20 py-2">
                <AlertCircle className="size-4" />
                <AlertDescription className="text-xs font-medium">{createError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-4">
              <div className="grid gap-1.5">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Full Name</Label>
                <Input id="name" name="name" placeholder="Dr. Jane Smith" required disabled={creating} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Work Email</Label>
                <Input id="email" name="email" type="email" placeholder="doctor@clinic.com" required disabled={creating} />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Temporary Password</Label>
                <Input id="password" name="password" type="password" required disabled={creating} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="specialization" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Specialization</Label>
                  <Input id="specialization" name="specialization" placeholder="Cardiology" disabled={creating} />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="licenseNumber" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">License No.</Label>
                  <Input id="licenseNumber" name="licenseNumber" placeholder="MCI-12345" disabled={creating} />
                </div>
              </div>
            </div>
            <Button type="submit" size="lg" className="w-full font-bold shadow-sm shadow-primary/20" disabled={creating}>
              {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 size-4" />}
              Create Account
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UsersTable({ users, loading, onToggle, onRoleChange, onEdit }: {
  users: User[]
  loading: string | null
  onToggle: (id: string, activate: boolean) => void
  onRoleChange: (id: string, role: string) => void
  onEdit: (u: User) => void
  token: string
}) {
  if (users.length === 0) {
    return (
      <p className="text-center py-12 text-sm text-muted-foreground font-medium">No users found in this group.</p>
    )
  }
  return (
    <Table>
      <TableHeader className="bg-muted/10">
        <TableRow>
          <TableHead className="pl-6 text-[10px] uppercase font-bold tracking-widest h-10">Name</TableHead>
          <TableHead className="text-[10px] uppercase font-bold tracking-widest h-10">Role</TableHead>
          <TableHead className="text-[10px] uppercase font-bold tracking-widest h-10">Status</TableHead>
          <TableHead className="text-[10px] uppercase font-bold tracking-widest h-10">Created</TableHead>
          <TableHead className="pr-6 text-right text-[10px] uppercase font-bold tracking-widest h-10">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map(u => (
          <TableRow key={u.id} className="hover:bg-muted/30 group">
            <TableCell className="pl-6 py-4">
              <div className="font-bold text-xs text-foreground uppercase tracking-tight">{u.name}</div>
              <div className="text-[10px] text-muted-foreground font-medium">{u.email}</div>
            </TableCell>
            <TableCell>
              <Badge
                variant={u.role === "ADMIN" ? "default" : "secondary"}
                className={`font-bold text-[9px] tracking-widest h-5 px-1.5 ${
                  u.role === "ADMIN" ? "bg-violet-600 hover:bg-violet-700" : ""
                }`}
              >
                {u.role}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={`text-[10px] font-bold h-5 px-2 border-transparent ${
                u.active ? "text-emerald-600 bg-emerald-50" : "text-amber-600 bg-amber-50"
              }`}>
                {u.active ? "Active" : "Pending"}
              </Badge>
            </TableCell>
            <TableCell className="text-muted-foreground text-[11px] font-medium italic">
              {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "—"}
            </TableCell>
            <TableCell className="pr-6 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel className="text-[10px] uppercase text-muted-foreground">Manage User</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-xs font-medium cursor-pointer" onClick={() => onEdit(u)}>
                    <Pencil className="size-3.5 mr-2" /> Edit Name
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className={`text-xs font-medium cursor-pointer ${u.active ? 'text-destructive' : 'text-emerald-600'}`}
                    onClick={() => onToggle(u.id, !u.active)}
                    disabled={loading === u.id}
                  >
                    {u.active ? (
                      <><Trash2 className="size-3.5 mr-2" /> Deactivate Account</>
                    ) : (
                      <><CheckCircle2 className="size-3.5 mr-2" /> Activate Account</>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                  
                  {u.role === "DOCTOR" ? (
                    <DropdownMenuItem className="text-xs font-medium cursor-pointer" onClick={() => onRoleChange(u.id, "ADMIN")} disabled={loading === u.id + "_role"}>
                      <ShieldCheck className="size-3.5 mr-2" /> Make Administrator
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem className="text-xs font-medium cursor-pointer" onClick={() => onRoleChange(u.id, "DOCTOR")} disabled={loading === u.id + "_role"}>
                      <Stethoscope className="size-3.5 mr-2" /> Demote to Doctor
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
