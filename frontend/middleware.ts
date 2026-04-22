import { auth } from "./lib/auth"
import { NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login", "/signup", "/api/auth"]

const ADMIN_PATHS = ["/dashboard/audit-log", "/dashboard/doctors"]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (isPublic) return NextResponse.next()

  if (!req.auth) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const role = req.auth.user?.role as string | undefined

  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p))
  if (isAdminPath && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/patients", req.url))
  }

  const isDoctorPath =
    pathname.startsWith("/patients") ||
    pathname.startsWith("/sessions") ||
    pathname.startsWith("/prescription-templates")

  if (isDoctorPath && role !== "DOCTOR") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
}
