import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface User {
    role?:             string
    token?:            string
    organizationId?:   string | null
    organizationName?: string | null
  }
  interface Session {
    user: {
      name?:             string | null
      email?:            string | null
      image?:            string | null
      role:              string
      accessToken:       string
      organizationId?:   string | null
      organizationName?: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?:             string
    accessToken?:      string
    organizationId?:   string | null
    organizationName?: string | null
  }
}
