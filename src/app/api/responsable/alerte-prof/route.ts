import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Resend } from "resend"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "RESPONSABLE") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  try {
    const { coursId, profEmail, profName, coursTitre, taux, cadence } = await req.json()

    // Notification système
    await prisma.notification.create({
      data: {
        titre: `Alerte cadence cours : ${coursTitre}`,
        message: `Votre progression moyenne (${cadence}h/semaine, ${taux}% accompli) nécessite une accélération pour respecter le calendrier.`,
        destinataire: profEmail || "prof",
        type: "ALERTE_RETARD",
      },
    })

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey && resendKey.startsWith("re_") && profEmail) {
      const resend = new Resend(resendKey)
      await resend.emails.send({
        from: "EduCompare <notifications@educompare.com>",
        to: profEmail,
        subject: `[EduCompare] Alerte de rythme pédagogique - ${coursTitre}`,
        html: `
          <h2>Alerte de rythme pédagogique</h2>
          <p>Bonjour ${profName || "Professeur"},</p>
          <p>Le suivi automatisé d'EduCompare indique un risque de dépassement sur le cours <strong>${coursTitre}</strong>.</p>
          <p>Avancement actuel : <strong>${taux}%</strong> (Moyenne : ${cadence}h/semaine).</p>
          <p>Merci de bien vouloir ajuster votre rythme afin de tenir les engagements du syllabus dans les délais.</p>
        `,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Erreur envoi notification" }, { status: 500 })
  }
}

