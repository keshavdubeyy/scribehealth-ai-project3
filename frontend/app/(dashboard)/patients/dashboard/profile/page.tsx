import { auth } from "@/lib/auth"
import { DoctorProfileForm } from "@/components/features/dashboard/doctor-profile-form"
import { redirect } from "next/navigation"

async function getDoctorProfile(token: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api"}/doctor/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 30 }
  })
  if (!res.ok) return null
  return res.json()
}

export default async function DoctorProfilePage() {
  const session = await auth()
  const token = session?.user?.accessToken
  const role = session?.user?.role

  if (role !== "DOCTOR" || !token) {
    redirect("/dashboard")
  }

  const profile = await getDoctorProfile(token)

  if (!profile) return <div>Failed to load profile.</div>

  return (
    <div className="space-y-8 max-w-[1280px]">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Clinical Profile</h2>
        <p className="text-slate-500">View and update your medical credentials and system information.</p>
      </div>
      
      <DoctorProfileForm profile={profile} token={token} />
    </div>
  )
}
