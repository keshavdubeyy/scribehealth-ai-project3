"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function AdminUsersTable({ initialUsers, token }: { initialUsers: any[], token: string }) {
  const [users, setUsers] = useState(initialUsers)
  const [loading, setLoading] = useState<string | null>(null)

  const toggleUser = async (userId: string, activate: boolean) => {
    const action = activate ? 'activate' : 'deactivate'
    setLoading(userId)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api"}/admin/users/${userId}/${action}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Action failed')
      
      // Update local state instead of refetching the entire table
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, active: activate } : u
      ))
    } catch (err) {
      console.error(err)
      alert("Failed to update user status.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
      <CardHeader className="bg-slate-50 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold text-slate-900 tracking-tight uppercase">
          All Users
        </CardTitle>
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
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500 font-medium">
                    No users found.
                  </TableCell>
                </TableRow>
            ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-6 font-semibold py-4">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`font-bold text-[10px] tracking-widest ${u.role === 'ADMIN' ? 'text-rose-500 border-rose-500/20 bg-rose-50' : 'text-indigo-500 border-indigo-500/20 bg-indigo-50'}`}>
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
                            <div className="flex items-center gap-1.5 text-slate-400 font-medium text-sm">
                                <AlertCircle size={14} />
                                Inactive
                            </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
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
                          Deactivate
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs font-semibold px-3 border-emerald-500/50 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700" 
                          onClick={() => toggleUser(u.id, true)}
                          disabled={loading === u.id}
                        >
                          Activate
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
