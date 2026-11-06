import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { authConfig } from "@/lib/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const rawEmail = (credentials.email as string).trim().toLowerCase()
        const rawPassword = credentials.password as string

        const user = await prisma.user.findFirst({
          where: {
            email: {
              equals: rawEmail,
            },
          },
        })

        if (!user) return null

        const isValid = await bcrypt.compare(
          rawPassword,
          user.password
        )
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      },
    }),
  ],
  session: { strategy: "jwt" },
})
