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

          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: credentials.email as string,
            password: credentials.password as string,
          })

          if (authError || !authData.user) {
            console.error("Supabase Auth failed:", authError?.message)
            return null
          }

          // Return only identity — role is always fetched fresh in the jwt callback
          return {
            id:    authData.user.id,
            email: authData.user.email as string,
            name:  authData.user.user_metadata?.name || authData.user.email?.split("@")[0] || "User",
            token: authData.session?.access_token || "",
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
        token.email       = user.email ?? token.email
        token.accessToken = (user as any).token ?? ""
      }
      // Always fetch role live from profiles — never trust a cached JWT role
      const email = (token.email as string | undefined)?.toLowerCase()
      if (email) {
        const supabase = createServiceClient()
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, role, organization_id, name, is_active, organizations(name)")
          .eq("email", email)
          .maybeSingle()
        token.role             = profile?.role             ?? "DOCTOR"
        token.organizationId   = profile?.organization_id  ?? null
        token.organizationName = (profile as any)?.organizations?.name ?? null
        token.isActive         = profile?.is_active        ?? true
        token.userId           = profile?.id               ?? null
        if (profile?.name) token.name = profile.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role             = token.role             as string
        session.user.accessToken      = token.accessToken      as string
        session.user.organizationId   = token.organizationId   as string
        session.user.organizationName = token.organizationName as string
        session.user.isActive         = token.isActive         as boolean
        session.user.id               = token.userId           as string
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
