import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { logAuditServer } from "@/lib/audit-server"
import { createServiceClient } from "@/utils/supabase/service"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "ScribeHealth AI",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const supabase = createServiceClient()

          // 1. Authenticate with Supabase Auth
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          })

          if (authError || !authData.user) {
            console.error("Supabase Auth failed:", authError?.message)
            return null
          }

          const email = credentials.email.toString().toLowerCase()

          // 2. Fetch profile metadata (role, name, org) from our 'profiles' table
          const { data: profile, error: profError } = await supabase
            .from("profiles")
            .select("*, organizations(name)")
            .eq("email", email)
            .maybeSingle()

          if (profError) {
            console.error("Profile lookup failed:", profError.message)
          }

          // EMERGENCY BYPASS FOR MIGRATION
          let effectiveRole = profile?.role || "DOCTOR"
          let effectiveName = profile?.name || authData.user.email?.split("@")[0] || "User"
          let effectiveOrg  = profile?.organization_id || null

          if (email === "rahul.chand@gmail.com") {
            effectiveRole = "ADMIN"
            effectiveName = "Dr. Rahul Chand"
            if (!effectiveOrg) effectiveOrg = "1cad8603-9aee-4516-9219-a8306e6e9d77"
          }

          console.log(`Auth Debug - Email: ${email}, Found Role: ${profile?.role}, Effective Role: ${effectiveRole}`)

          // Return enriched session user
          return {
            id:               authData.user.id,
            name:             effectiveName,
            email:            authData.user.email as string,
            role:             effectiveRole,
            token:            authData.session?.access_token || "",
            organizationId:   effectiveOrg,
            organizationName: (profile as any)?.organizations?.name || (effectiveRole === "ADMIN" ? "ScribeHealth Medical Group" : null),
          }
        } catch (error) {
          console.error("Auth process error:", error)
          return null
        }
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role             = user.role
        token.accessToken      = user.token
        token.organizationId   = user.organizationId
        token.organizationName = user.organizationName
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role             = token.role             as string
        session.user.accessToken      = token.accessToken      as string
        session.user.organizationId   = token.organizationId   as string
        session.user.organizationName = token.organizationName as string
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  events: {
    async signIn({ user }) {
      const email = user.email ?? "unknown"
      await logAuditServer(email, "login_success", "user", email, { name: user.name ?? "" })
    },
    async signOut(message) {
      const email = "token" in message && message.token?.email
        ? String(message.token.email)
        : "unknown"
      await logAuditServer(email, "logout", "user", email)
    },
  },
})
