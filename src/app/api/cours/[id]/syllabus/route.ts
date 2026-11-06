import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { structureSyllabusWithAI } from "@/lib/syllabus-ai"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const coursId = params.id
    const syllabus = await prisma.syllabus.findUnique({
      where: { coursId },
      include: {
        cours: {
          select: {
            id: true,
            titre: true,
            heuresPrevues: true,
            filiere: true,
          },
        },
      },
    })

    return NextResponse.json(syllabus || null)
  } catch (err) {
    return NextResponse.json({ error: "Erreur récupération syllabus" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { contenu, fichierUrl, structure, autoStructure } = await req.json()
    const coursId = params.id

    const cours = await prisma.cours.findUnique({
      where: { id: coursId },
    })

    if (!cours) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 })
    }

    let finalStructure = structure

    // Si pas de structure ou autoStructure demandé et contenu présent, structurer via l'IA
    if ((!finalStructure || autoStructure) && contenu && contenu.trim().length > 10) {
      const aiResult = await structureSyllabusWithAI(
        contenu,
        cours.titre,
        cours.heuresPrevues
      )
      finalStructure = aiResult.structure
    }

    const syllabus = await prisma.syllabus.upsert({
      where: { coursId },
      update: {
        contenu,
        fichierUrl: fichierUrl || null,
        structure: finalStructure ? (finalStructure as any) : undefined,
      },
      create: {
        coursId,
        contenu,
        fichierUrl: fichierUrl || null,
        structure: finalStructure ? (finalStructure as any) : undefined,
      },
    })

    return NextResponse.json(syllabus)
  } catch (err) {
    console.error("Erreur enregistrement syllabus:", err)
    return NextResponse.json({ error: "Erreur enregistrement syllabus" }, { status: 500 })
  }
}
