import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { logAuditServer } from "@/lib/audit-server"

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
          const apiBase = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080/api"
          const res = await fetch(`${apiBase}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const user = await res.json()

          if (res.ok && user && user.token) {
            // Mapping current backend response to NextAuth user object
            return {
              id: user.token, // Using token as ID for simplified handling
              name: user.name,
              email: credentials.email as string,
              role: user.role,
              token: user.token
            }
          }
          return null
        } catch (error) {
          console.error("Auth error:", error)
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
        token.role = user.role
        token.accessToken = user.token
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string
        session.user.accessToken = token.accessToken as string
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
