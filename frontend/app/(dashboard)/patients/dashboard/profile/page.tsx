import { auth } from "@/lib/auth"
import { DoctorProfileForm } from "@/components/features/dashboard/doctor-profile-form"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/page-header"

import { createServiceClient } from "@/utils/supabase/service"

async function getDoctorProfile(email: string) {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle()
  
  if (error) {
    console.error("Profile fetch error:", error.message)
  }
  return data
}

export default async function DoctorProfilePage() {
  const session = await auth()
  const token = session?.user?.accessToken
  const role = session?.user?.role

  if (role !== "DOCTOR" || !token) {
    redirect("/patients")
  }

  const profile = await getDoctorProfile(session?.user?.email || "")

  if (!profile) return <div>Failed to load profile.</div>

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Profile"
        description="View and update your medical credentials and system information."
      />
      <DoctorProfileForm profile={profile} token={token} />
    </div>
  )
}
