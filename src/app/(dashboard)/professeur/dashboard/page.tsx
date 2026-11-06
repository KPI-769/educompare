import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { BookOpen, CheckSquare, Upload, Calendar, Users } from "lucide-react"

export default async function ProfesseurDashboard() {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!session || (session.user as any)?.role !== "PROFESSEUR") redirect("/login")

  const cours = await prisma.cours.findMany({
    where: { profId: userId },
    include: {
      niveau: true,
      delegue: { select: { name: true } },
      progressions: {
        include: { validation: true },
        orderBy: { createdAt: "desc" },
      },
      uploads: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  const totalProgressions = cours.flatMap((c) => c.progressions)
  const pendingValidations = totalProgressions.filter(
    (p) => !p.validation || p.validation.status === "PENDING"
  )

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Espace Professeur</h1>
          <p className="text-gray-500 mt-1">Supervision de vos enseignements et validations</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link href="/professeur/validations" className="w-full sm:w-auto">
            <Button variant="default" className="w-full sm:w-auto">
              <CheckSquare className="w-4 h-4 mr-1.5" />
              Validations ({pendingValidations.length})
            </Button>
          </Link>
          <Link href="/professeur/uploads" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <Upload className="w-4 h-4 mr-1.5" />
              Analyser un support
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Mes cours</p>
              <p className="text-3xl font-bold">{cours.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Validations en attente</p>
              <p className="text-3xl font-bold text-amber-600">{pendingValidations.length}</p>
            </div>
            <CheckSquare className="w-8 h-8 text-amber-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Supports analysés IA</p>
              <p className="text-3xl font-bold">
                {cours.filter((c) => c.uploads.length > 0).length}
              </p>
            </div>
            <Upload className="w-8 h-8 text-green-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mes enseignements en cours</CardTitle>
          <CardDescription>Progression déclarée par les délégués et état de conformité</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cours.map((c) => {
              const dernierArret = c.progressions[0]
              const lastUpload = c.uploads[0]

              return (
                <div key={c.id} className="p-4 border rounded-lg bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{c.titre}</span>
                      <Badge variant="outline">{c.filiere} - S{c.semestre}</Badge>
                      {lastUpload && (
                        <Badge variant={lastUpload.scoreIA && lastUpload.scoreIA >= 70 ? "success" : "destructive"}>
                          IA: {lastUpload.scoreIA}% conforme
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Niveau : {c.niveau.nom} • Délégué : {c.delegue?.name || "Non assigné"}
                    </p>
                    <p className="text-sm text-gray-700 font-medium">
                      Dernier arrêt : {dernierArret?.partieAtteinte || "Aucune séance encore déclarée"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/professeur/validations`}>
                      <Button size="sm" variant="outline">
                        Gérer validations
                      </Button>
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
