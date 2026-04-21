import { auth } from "@/lib/auth"
import { AdminUsersTable } from "@/components/features/dashboard/admin-users-table"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
export const revalidate = 0

import { createServiceClient } from "@/utils/supabase/service"

async function getAllUsers(orgId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("organization_id", orgId)
  return data ?? []
}

async function getOrganizations(orgId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", orgId)
  return data ?? []
}

async function getInvites(orgId: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from("invites")
    .select("*")
    .eq("organization_id", orgId)
  return data ?? []
}

import { PageHeader } from "@/components/page-header"

export default async function AdminUsersPage() {
  const session = await auth()
  const orgId = session?.user?.organizationId
  const token = session?.user?.accessToken
  const role = session?.user?.role

  if (role !== "ADMIN" || !token) {
    redirect("/patients")
  }

  const [rawUsers, organizations, rawInvites] = await Promise.all([
    getAllUsers(orgId || ""),
    getOrganizations(orgId || ""),
    getInvites(orgId || ""),
  ])

  const users = rawUsers.map((u: any) => ({
    id:             u.email,
    name:           u.name,
    email:          u.email,
    role:           u.role,
    active:         u.is_active,
    organizationId: u.organization_id,
    createdAt:      u.created_at,
  }))

  const invites = rawInvites.map((inv: any) => ({
    id:             inv.email,
    code:           inv.email.replace("invite_", ""),
    organizationId: inv.organization_id,
    createdByEmail: "",
    expiresAt:      null,
    maxUses:        0,
    useCount:       0,
    isActive:       inv.status !== "EXPIRED",
    isUsable:       inv.status === "PENDING",
    createdAt:      inv.created_at,
  }))

  const pending = users.filter(u => !u.active).length

  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <PageHeader
          title="System Access"
          description="Create doctors, activate accounts, and manage roles across your organization."
        />
        {pending > 0 && (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200/50 px-3 py-1 rounded-full">
            {pending} account{pending !== 1 ? "s" : ""} pending
          </span>
        )}
      </div>

      <AdminUsersTable initialUsers={users} organizations={organizations} initialInvites={invites} token={token} />
    </div>
  )
}
