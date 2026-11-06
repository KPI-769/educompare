import type { NextAuthConfig } from "next-auth"

export const authConfig = {
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "58817368c22398b36d3c73280ea41736d2b78ae783dac049edee392bf0253cf6",
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname
      const user = auth?.user as any

      const roleRoutes: Record<string, string[]> = {
        SUPER_ADMIN: ["/super-admin"],
        RESPONSABLE: ["/responsable"],
        DELEGUE: ["/delegue"],
        PROFESSEUR: ["/professeur"],
        ETUDIANT: ["/etudiant"],
      }

      // Public paths
      if (
        pathname === "/" ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/etudiant") ||
        pathname.startsWith("/api/etudiant") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/socket")
      ) {
        return true
      }

      if (!isLoggedIn) return false

      for (const [role, paths] of Object.entries(roleRoutes)) {
        if (paths.some((p) => pathname.startsWith(p)) && user?.role !== role) {
          return false
        }
      }

      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  providers: [],
} satisfies NextAuthConfig

