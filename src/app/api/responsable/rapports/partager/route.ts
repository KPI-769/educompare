import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = (session?.user as any)?.id

  if (!session || (session.user as any)?.role !== "RESPONSABLE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { semaine, annee, commentaire } = await req.json()

    const rapport = await prisma.rapport.create({
      data: {
        semaine: Number(semaine) || 1,
        annee: Number(annee) || 2026,
        contenu: `Synthèse hebdomadaire de la semaine ${semaine}/${annee} générée par le responsable.`,
        commentaire: commentaire || null,
        partageAdmin: true,
        responsableId: userId,
      },
    })

    // Créer une notification pour les Super Admins
    const superAdmins = await prisma.user.findMany({
      where: { role: "SUPER_ADMIN" },
      select: { email: true },
    })

    for (const sa of superAdmins) {
      await prisma.notification.create({
        data: {
          titre: `Nouveau rapport hebdomadaire S${semaine}`,
          message: `Le responsable a soumis le rapport de la semaine ${semaine} avec des commentaires personnalisés.`,
          destinataire: sa.email,
          type: "RAPPORT_HEBDO",
        },
      })
    }

    return NextResponse.json(rapport, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: "Erreur enregistrement rapport" }, { status: 500 })
  }
}

