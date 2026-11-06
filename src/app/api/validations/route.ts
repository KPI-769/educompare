import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const validationSchema = z.object({
  progressionId: z.string(),
  status: z.enum(["VALIDATED", "REFUSED"]),
  commentaire: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if ((session?.user as any)?.role !== "PROFESSEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = validationSchema.parse(body)

    const progression = await prisma.progressionCours.findUnique({
      where: { id: data.progressionId },
      include: {
        cours: true,
        delegue: true,
      },
    })

    const existing = await prisma.validationProf.findUnique({
      where: { progressionId: data.progressionId },
    })

    let result
    if (existing) {
      result = await prisma.validationProf.update({
        where: { progressionId: data.progressionId },
        data: { status: data.status, commentaire: data.commentaire },
      })
    } else {
      result = await prisma.validationProf.create({
        data: {
          progressionId: data.progressionId,
          status: data.status,
          commentaire: data.commentaire,
          profId: (session!.user as any).id,
        },
      })
    }

    // Notification envoyée au délégué
    if (progression?.delegue?.email) {
      const statusLabel = data.status === "VALIDATED" ? "validée" : "refusée"
      await prisma.notification.create({
        data: {
          titre: `Séance ${statusLabel} par le professeur (${progression.cours.titre})`,
          message: `Le professeur a ${statusLabel} votre déclaration de séance.${data.commentaire ? ` Commentaire : "${data.commentaire}"` : ""}`,
          destinataire: progression.delegue.email,
          type: "REPONSE_VALIDATION",
        },
      })
    }

    return NextResponse.json(result, { status: existing ? 200 : 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

