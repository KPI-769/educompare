import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const progressionSchema = z.object({
  coursId: z.string().min(1, "Veuillez sélectionner un cours"),
  heureDebut: z.string().refine((val: string) => !isNaN(Date.parse(val)), {
    message: "Date de début invalide",
  }),
  heureFin: z.string().refine((val: string) => !isNaN(Date.parse(val)), {
    message: "Date de fin invalide",
  }),
  partieAtteinte: z.string().min(2, "Veuillez préciser la partie atteinte (au moins 2 caractères)"),
  chapitreId: z.string().optional().nullable(),
  chapitreTitre: z.string().optional().nullable(),
  grandTitreId: z.string().optional().nullable(),
  grandTitreNom: z.string().optional().nullable(),
  heuresEffectives: z.number().positive("Le nombre d'heures doit être supérieur à 0"),
  semaine: z.number().int().min(1).max(53),
  annee: z.number().int().min(2020),
})

export async function GET(req: Request) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

  const user = session.user as any
  const role = user?.role
  const userId = user?.id

  const { searchParams } = new URL(req.url)
  const coursId = searchParams.get("coursId")
  const delegueId = searchParams.get("delegueId")

  let whereClause: any = {
    ...(coursId ? { coursId } : {}),
    ...(delegueId ? { delegueId } : {}),
  }

  // Si c'est un professeur, filtrer automatiquement sur ses cours
  if (role === "PROFESSEUR") {
    whereClause = {
      ...whereClause,
      cours: { profId: userId },
    }
  }

  // Si c'est un délégué, filtrer par défaut sur ses déclarations
  if (role === "DELEGUE" && !coursId) {
    whereClause = {
      ...whereClause,
      delegueId: userId,
    }
  }

  const progressions = await prisma.progressionCours.findMany({
    where: whereClause,
    include: {
      cours: {
        select: {
          id: true,
          titre: true,
          codeEtudiant: true,
          profId: true,
          delegueId: true,
        },
      },
      delegue: { select: { id: true, name: true, email: true } },
      validation: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(progressions)
}

export async function POST(req: Request) {
  const session = await auth()
  if ((session?.user as any)?.role !== "DELEGUE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = progressionSchema.parse(body)

    const cours = await prisma.cours.findUnique({
      where: { id: data.coursId },
      include: {
        prof: true,
      },
    })

    if (!cours) {
      return NextResponse.json({ error: "Cours introuvable" }, { status: 404 })
    }

    const delegueUserId = (session!.user as any).id
    if (!cours.delegueId) {
      await prisma.cours.update({
        where: { id: cours.id },
        data: { delegueId: delegueUserId },
      })
    }

    const progression = await prisma.progressionCours.create({
      data: {
        ...data,
        heureDebut: new Date(data.heureDebut),
        heureFin: new Date(data.heureFin),
        delegueId: delegueUserId,
        notifEnvoyee: true,
      },
    })

    // Envoi de la notification de confirmation au professeur assigné
    if (cours?.prof?.email) {
      await prisma.notification.create({
        data: {
          titre: `Séance à valider : ${cours.titre}`,
          message: `Le délégué ${(session?.user as any)?.name || "étudiant"} a renseigné la séance (S${data.semaine}, ${data.heuresEffectives}h). Partie atteinte : "${data.partieAtteinte}". En attente de votre confirmation.`,
          destinataire: cours.prof.email,
          type: "VALIDATION_SEANCE",
        },
      })
    }

    return NextResponse.json(progression, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      const msg = error.issues.map((i: z.ZodIssue) => i.message).join(", ")
      return NextResponse.json({ error: msg, details: error.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur serveur lors de la création" }, { status: 500 })
  }
}

