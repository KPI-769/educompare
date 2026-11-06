import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { structureSyllabusWithAI } from "@/lib/syllabus-ai"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { text, titreCours, heuresPrevues } = await req.json()

    if (!text || text.trim().length < 5) {
      return NextResponse.json({ error: "Texte de syllabus requis (au moins 5 caractères)" }, { status: 400 })
    }

    const { structure, provider } = await structureSyllabusWithAI(
      text,
      titreCours || "Cours universitaire",
      Number(heuresPrevues) || 40
    )

    return NextResponse.json({
      structure,
      provider,
      success: true,
    })
  } catch (err: any) {
    console.error("Erreur structuration syllabus:", err)
    return NextResponse.json({ error: "Erreur lors de la structuration par l'IA" }, { status: 500 })
  }
}

