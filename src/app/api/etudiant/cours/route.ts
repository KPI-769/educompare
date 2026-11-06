import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.json({ error: "Code requis" }, { status: 400 })
  }

  try {
    const cours = await prisma.cours.findUnique({
      where: { codeEtudiant: code },
      include: {
        niveau: true,
        prof: { select: { name: true } },
        syllabus: true,
        progressions: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    if (!cours) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 })
    }

    return NextResponse.json(cours)
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

