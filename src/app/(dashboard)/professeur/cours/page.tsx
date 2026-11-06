import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, Calendar, Clock, UserCheck } from "lucide-react"

export default async function ProfesseurCoursPage() {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!session || (session.user as any)?.role !== "PROFESSEUR") redirect("/login")

  const cours = await prisma.cours.findMany({
    where: { profId: userId },
    include: {
      niveau: true,
      delegue: { select: { name: true, email: true } },
      progressions: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      syllabus: true,
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Mes Enseignements</h1>
          <p className="text-gray-500 mt-1">Vue détaillée de vos matières et des syllabi associés</p>
        </div>
        <Link href="/professeur/uploads">
          <Button>Analyser un cours (IA)</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cours.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Aucun cours ne vous a été assigné pour le moment.
          </div>
        ) : (
          cours.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <Badge variant="outline">{c.filiere} • S{c.semestre}</Badge>
                  <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                    {c.codeEtudiant}
                  </span>
                </div>
                <CardTitle className="text-lg mt-2">{c.titre}</CardTitle>
                <CardDescription>{c.niveau.nom}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-gray-500 space-y-1">
                  <p className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" /> Délégué : {c.delegue?.name || "Non assigné"}
                  </p>
                  <p className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Volume prévu : {c.heuresPrevues}h
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground font-medium">Dernier point d&apos;arrêt (délégué) :</p>
                  <p className="text-xs text-gray-800 line-clamp-2 mt-0.5">
                    {c.progressions[0]?.partieAtteinte || "Aucune séance encore renseignée"}
                  </p>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-xs">
                  <span className="text-gray-500">Syllabus officiel :</span>
                  <Badge variant={c.syllabus ? "success" : "secondary"}>
                    {c.syllabus ? "Présent" : "Non défini"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

