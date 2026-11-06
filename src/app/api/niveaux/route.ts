import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const niveauSchema = z.object({
  nom: z.string().min(2),
  description: z.string().optional(),
})

export async function GET() {
  const session = await auth()
  const role = (session?.user as any)?.role
  const userId = (session?.user as any)?.id

  let whereClause: any = {}

  // Si c'est un Responsable, ne renvoyer que son niveau académique assigné
  if (role === "RESPONSABLE" && userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { niveauId: true },
    })
    if (dbUser?.niveauId) {
      whereClause.id = dbUser.niveauId
    }
  }

  const niveaux = await prisma.niveau.findMany({
    where: whereClause,
    include: {
      _count: { select: { cours: true, users: true } },
    },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(niveaux)
}

export async function POST(req: Request) {
  const session = await auth()
  if ((session?.user as any)?.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = niveauSchema.parse(body)
    const niveau = await prisma.niveau.create({ data })
    return NextResponse.json(niveau, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

