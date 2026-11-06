import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["SUPER_ADMIN", "RESPONSABLE", "DELEGUE", "PROFESSEUR", "ETUDIANT"]),
  niveauId: z.string().optional(),
})

export async function GET(req: Request) {
  const session = await auth()
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id

  if (!session || !["SUPER_ADMIN", "RESPONSABLE"].includes(role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  let whereClause: any = {}

  // Si Responsable de filière, filtrer sur les utilisateurs de son niveau assigné
  if (role === "RESPONSABLE" && userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { niveauId: true },
    })
    if (dbUser?.niveauId) {
      whereClause = {
        OR: [
          { createdById: userId },
          { niveauId: dbUser.niveauId },
          { coursProf: { some: { niveauId: dbUser.niveauId } } },
          { coursDelegue: { some: { niveauId: dbUser.niveauId } } },
        ],
      }
    } else {
      whereClause = { createdById: userId }
    }
  }

  const users = await prisma.user.findMany({
    where: whereClause,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      niveau: { select: { nom: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(users)
}

export async function POST(req: Request) {
  const session = await auth()
  const role = (session?.user as any)?.role

  // Le Super Admin peut créer tous les comptes
  // Le Responsable de filière peut créer les comptes Délégués et Professeurs
  if (!session || (role !== "SUPER_ADMIN" && role !== "RESPONSABLE")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = createUserSchema.parse(body)

    // Un responsable ne peut créer que des délégués ou des professeurs
    if (role === "RESPONSABLE" && !["DELEGUE", "PROFESSEUR"].includes(data.role)) {
      return NextResponse.json({ error: "Vous pouvez uniquement créer des comptes Délégué ou Professeur" }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    let assignedNiveauId = data.niveauId || null
    if (role === "RESPONSABLE") {
      const dbUser = await prisma.user.findUnique({
        where: { id: (session!.user as any).id },
        select: { niveauId: true },
      })
      if (dbUser?.niveauId) {
        assignedNiveauId = dbUser.niveauId
      }
    }

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: data.role,
        niveauId: assignedNiveauId,
        createdById: (session!.user as any).id,
      },
    })

    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

