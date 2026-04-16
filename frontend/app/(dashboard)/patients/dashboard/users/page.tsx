import { auth } from "@/lib/auth"
import { AdminUsersTable } from "@/components/features/dashboard/admin-users-table"
import { redirect } from "next/navigation"

async function getAllUsers(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api"}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { tags: ['users'], revalidate: 30 }
  })
  if (!res.ok) return []
  return res.json()
}

export default async function AdminUsersPage() {
  const session = await auth()
  const token = session?.user?.accessToken
  const role = session?.user?.role

  if (role !== "ADMIN" || !token) {
    redirect("/dashboard")
  }

  const users = await getAllUsers(token)

  return (
    <div className="space-y-8 max-w-[1280px]">
      <div>
        <h2 className="text-3xl font-bold text-foreground tracking-tight">Manage System Access</h2>
        <p className="text-muted-foreground">View and toggle user account status across the clinic.</p>
      </div>
      
      <AdminUsersTable initialUsers={users} token={token} />
    </div>
  )
}
