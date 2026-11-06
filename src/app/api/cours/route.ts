import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { v4 as uuidv4 } from "uuid"

const coursSchema = z.object({
  titre: z.string().min(2),
  description: z.string().optional(),
  heuresPrevues: z.number().positive(),
  filiere: z.string().min(1),
  semestre: z.number().int().min(1).max(12),
  niveauId: z.string(),
  profId: z.string().optional(),
  delegueId: z.string().optional(),
})

function generateCode(): string {
  return uuidv4().replace(/-/g, "").slice(0, 8).toUpperCase()
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const user = session.user as any
  const role = user?.role
  const userId = user?.id

  const { searchParams } = new URL(req.url)
  const niveauId = searchParams.get("niveauId")

  let whereClause: any = niveauId ? { niveauId } : {}

  // Sécurité par rôle : le professeur ne peut consulter que ses propres cours
  if (role === "PROFESSEUR") {
    whereClause = {
      ...whereClause,
      profId: userId,
    }
  } else if (role === "DELEGUE") {
    // Si des cours lui sont explicitement assignés, filtrer dessus, sinon inclure les cours sans délégué assigné
    const hasAssigned = await prisma.cours.count({ where: { delegueId: userId } })
    if (hasAssigned > 0) {
      whereClause = {
        ...whereClause,
        delegueId: userId,
      }
    } else {
      whereClause = {
        ...whereClause,
        OR: [
          { delegueId: userId },
          { delegueId: null },
        ],
      }
    }
  } else if (role === "RESPONSABLE") {
    // Le Responsable de filière ne consulte strictement que les cours de son niveau assigné
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { niveauId: true },
    })
    if (dbUser?.niveauId) {
      whereClause = {
        ...whereClause,
        niveauId: dbUser.niveauId,
      }
    }
  }

  const cours = await prisma.cours.findMany({
    where: whereClause,
    include: {
      niveau: true,
      syllabus: true,
      prof: { select: { id: true, name: true, email: true } },
      delegue: { select: { id: true, name: true, email: true } },
      progressions: {
        include: { validation: true },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { progressions: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(cours)
}

export async function POST(req: Request) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session || !["SUPER_ADMIN", "RESPONSABLE"].includes(role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = coursSchema.parse(body)

    // Si Responsable, forcer le niveauId sur son niveau académique assigné
    if (role === "RESPONSABLE") {
      const dbUser = await prisma.user.findUnique({
        where: { id: (session.user as any)?.id },
        select: { niveauId: true },
      })
      if (dbUser?.niveauId) {
        data.niveauId = dbUser.niveauId
      }
    }

    const cours = await prisma.cours.create({
      data: {
        ...data,
        codeEtudiant: generateCode(),
      },
    })

    return NextResponse.json(cours, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

