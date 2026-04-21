import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

// Paths only admins may visit
const ADMIN_ONLY = [
  "/patients/dashboard/doctors",
  "/patients/dashboard/users",
  "/patients/dashboard/audit-log",
]

// Paths only doctors may visit (admin is redirected to dashboard)
function isDoctorOnly(pathname: string): boolean {
  if (pathname.startsWith("/consultation")) return true
  if (pathname.startsWith("/patients/sessions")) return true
  if (pathname.startsWith("/patients/dashboard/prescription-template")) return true
  if (pathname === "/patients") return true
  // /patients/<anything> that is NOT /patients/dashboard
  if (pathname.startsWith("/patients/") && !pathname.startsWith("/patients/dashboard")) return true
  return false
}

function isAdminOnly(pathname: string): boolean {
  return ADMIN_ONLY.some(p => pathname.startsWith(p))
}

export default auth(function middleware(req) {
  const session = req.auth as { user?: { role?: string } } | null
  const role    = session?.user?.role
  const { pathname } = req.nextUrl

  // Logged-in users on auth pages → send home
  if (session && (pathname.startsWith("/login") || pathname.startsWith("/signup"))) {
    const dest = role === "ADMIN" ? "/patients/dashboard" : "/patients"
    return NextResponse.redirect(new URL(dest, req.url))
  }

  // Unauthenticated on protected pages → login
  // Note: We never redirect /api routes. They handle their own 401s or are public (auth).
  const isPublic = pathname === "/" ||
                   pathname.startsWith("/login") ||
                   pathname.startsWith("/signup") ||
                   pathname.startsWith("/api")
  
  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Admin cannot enter doctor workflows
  if (role === "ADMIN" && isDoctorOnly(pathname)) {
    return NextResponse.redirect(new URL("/patients/dashboard", req.url))
  }

  // Doctor cannot enter admin-only pages
  if (role === "DOCTOR" && isAdminOnly(pathname)) {
    return NextResponse.redirect(new URL("/patients", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
