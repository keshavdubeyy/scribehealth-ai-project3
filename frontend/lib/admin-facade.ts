/**
 * Facade Pattern — AdminFacade (FR-02, NFR-04)
 *
 * Problem: The admin UI was calling Spring Boot REST endpoints directly with
 * raw fetch() calls, scattering API knowledge (base URL, headers, error
 * handling) across every component.
 *
 * Solution: AdminFacade is a single class that encapsulates ALL admin
 * operations behind a clean, typed interface.  Components never touch fetch()
 * directly — they talk only to AdminFacade.  This means:
 *   - API base URL is configured once
 *   - Auth headers are injected once
 *   - Error handling is centralised once
 *   - Adding a new admin operation requires ONE method here, not scattered
 *     fetch() calls across the codebase
 */

// Next.js inlines NEXT_PUBLIC_* at build time, so this is always a string literal
// in the final bundle.  The typeof guard keeps TS happy under a DOM-only tsconfig
// (no @types/node), while still working correctly in both server and client renders.
const API_BASE: string =
  typeof process !== "undefined" && typeof process.env !== "undefined"
    ? (process.env["NEXT_PUBLIC_API_BASE"] ?? "/api")
    : "/api"

// ── Shared response types ─────────────────────────────────────────────────────

export interface UserSummary {
  id: string
  name: string
  email: string
  role: "DOCTOR" | "ADMIN"
  active: boolean
  createdAt: string | null
  lastLoginAt: string | null
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: "DOCTOR" | "ADMIN"
}

// ── Internal helper ───────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  })

  if (!res.ok) {
    // Try to extract a server-side message; fall back to HTTP status text
    let message = res.statusText
    try {
      const body = await res.json()
      if (body?.message) message = body.message
      else if (body?.error) message = body.error
    } catch {
      // ignore parse errors — keep statusText
    }
    throw new Error(message)
  }

  // 204 No Content responses have no body
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Facade class ──────────────────────────────────────────────────────────────

/**
 * AdminFacade — single entry point for all admin operations.
 *
 * Usage:
 *   const facade = new AdminFacade(token)
 *   const users  = await facade.getAllUsers()
 *   await facade.toggleUserActivation(userId, false)   // deactivate
 *   await facade.createUser({ name, email, password, role })
 */
export class AdminFacade {
  constructor(private readonly token: string) {}

  // ── User management ─────────────────────────────────────────────────────────

  /** Fetch all registered users. */
  getAllUsers(): Promise<UserSummary[]> {
    return apiFetch<UserSummary[]>("/admin/users", this.token)
  }

  /** Fetch a single user by ID. */
  getUser(userId: string): Promise<UserSummary> {
    return apiFetch<UserSummary>(`/admin/users/${userId}`, this.token)
  }

  /**
   * Activate or deactivate a user account.
   * @param activate true → activate, false → deactivate
   */
  toggleUserActivation(userId: string, activate: boolean): Promise<{ message: string; userId: string }> {
    return apiFetch(`/admin/users/${userId}`, this.token, {
      method: "PATCH",
      body: JSON.stringify({ active: activate }),
    })
  }

  /**
   * Create a new user account as an admin (FR-02).
   * The user is immediately active; no email verification step.
   */
  createUser(data: CreateUserRequest): Promise<UserSummary> {
    return apiFetch<UserSummary>("/admin/users", this.token, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  /** Get aggregate counts (totalUsers, totalDoctors, totalAdmins, activeUsers). */
  getStats(): Promise<Record<string, number>> {
    return apiFetch<Record<string, number>>("/admin/stats", this.token)
  }
}
