import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional().nullable(),
  role: z.enum(["SUPER_ADMIN", "RESPONSABLE", "DELEGUE", "PROFESSEUR", "ETUDIANT"]).optional(),
  niveauId: z.string().optional().nullable(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const role = (session?.user as any)?.role

  if (!session || !["SUPER_ADMIN", "RESPONSABLE"].includes(role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        niveauId: true,
        createdAt: true,
        niveau: { select: { id: true, nom: true } },
        coursProf: { select: { id: true, titre: true } },
        coursDelegue: { select: { id: true, titre: true } },
      },
    })

    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

    return NextResponse.json(user)
  } catch (err) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const callerRole = (session?.user as any)?.role
  const callerId = (session?.user as any)?.id

  if (!session || !["SUPER_ADMIN", "RESPONSABLE"].includes(callerRole)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const data = updateUserSchema.parse(body)

    // Récupérer l'utilisateur cible
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { id: true, role: true, niveauId: true },
    })

    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    // Un responsable ne peut modifier que les DELEGUE / PROFESSEUR
    if (callerRole === "RESPONSABLE") {
      if (!["DELEGUE", "PROFESSEUR"].includes(targetUser.role)) {
        return NextResponse.json({ error: "Accès refusé : vous ne pouvez modifier que les délégués et professeurs" }, { status: 403 })
      }
      // Le responsable ne peut pas changer le rôle vers super_admin ou responsable
      if (data.role && !["DELEGUE", "PROFESSEUR"].includes(data.role)) {
        return NextResponse.json({ error: "Changement de rôle non autorisé" }, { status: 403 })
      }
      // Un responsable ne peut pas changer le niveauId (hors de son niveau)
      if (data.niveauId !== undefined) {
        const dbCaller = await prisma.user.findUnique({
          where: { id: callerId },
          select: { niveauId: true },
        })
        if (dbCaller?.niveauId && data.niveauId && data.niveauId !== dbCaller.niveauId) {
          return NextResponse.json({ error: "Vous ne pouvez assigner qu'au niveau de votre filière" }, { status: 403 })
        }
      }
    }

    // Vérifier unicité de l'email si modifié
    if (data.email) {
      const existing = await prisma.user.findFirst({
        where: { email: data.email, id: { not: params.id } },
      })
      if (existing) return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 400 })
    }

    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.email) updateData.email = data.email
    if (data.role) updateData.role = data.role
    if (data.niveauId !== undefined) updateData.niveauId = data.niveauId || null
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12)
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, niveauId: true },
    })

    return NextResponse.json(updated)
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  const callerRole = (session?.user as any)?.role
  const callerId = (session?.user as any)?.id

  if (!session || !["SUPER_ADMIN", "RESPONSABLE"].includes(callerRole)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  // Empêcher l'auto-suppression
  if (params.id === callerId) {
    return NextResponse.json({ error: "Vous ne pouvez pas supprimer votre propre compte" }, { status: 403 })
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true },
    })

    if (!targetUser) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })

    // Un responsable ne peut supprimer que DELEGUE / PROFESSEUR
    if (callerRole === "RESPONSABLE" && !["DELEGUE", "PROFESSEUR"].includes(targetUser.role)) {
      return NextResponse.json({ error: "Vous ne pouvez supprimer que les délégués et professeurs" }, { status: 403 })
    }

    // Un super admin ne peut pas supprimer un autre super admin
    if (targetUser.role === "SUPER_ADMIN") {
      return NextResponse.json({ error: "Impossible de supprimer un Super Administrateur" }, { status: 403 })
    }

    await prisma.user.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 })
  }
}

