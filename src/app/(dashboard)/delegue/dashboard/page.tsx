import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, ClipboardList, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function DelegueDashboard() {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!session || (session.user as any)?.role !== "DELEGUE") redirect("/login")

  const cours = await prisma.cours.findMany({
    where: { delegueId: userId },
    include: {
      progressions: {
        include: { validation: true },
        orderBy: { createdAt: "desc" },
      },
      niveau: true,
      prof: { select: { name: true } },
    },
  })

  const totalProgressions = cours.reduce((s, c) => s + c.progressions.length, 0)
  const pendingValidations = cours.reduce(
    (s, c) =>
      s + c.progressions.filter((p) => !p.validation || p.validation.status === "PENDING").length,
    0
  )

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon espace Délégué</h1>
        <p className="text-muted-foreground">Gérez la progression de vos cours</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Mes cours</p>
              <p className="text-3xl font-bold">{cours.length}</p>
            </div>
            <BookOpen className="w-8 h-8 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Séances enregistrées</p>
              <p className="text-3xl font-bold">{totalProgressions}</p>
            </div>
            <ClipboardList className="w-8 h-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En attente validation</p>
              <p className="text-3xl font-bold">{pendingValidations}</p>
            </div>
            <Clock className="w-8 h-8 text-orange-500" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mes cours</CardTitle>
              <CardDescription>Progressions enregistrées ce semestre</CardDescription>
            </div>
            <Link href="/delegue/progressions">
              <Button size="sm">+ Nouvelle séance</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {cours.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun cours assigné. Contactez votre responsable.
            </p>
          ) : (
            <div className="space-y-4">
              {cours.map((c) => {
                const effectuees = c.progressions.reduce((s, p) => s + p.heuresEffectives, 0)
                const pct = c.heuresPrevues > 0
                  ? Math.min(100, Math.round((effectuees / c.heuresPrevues) * 100))
                  : 0
                const lastProg = c.progressions[0]
                return (
                  <div key={c.id} className="border rounded-lg p-4">
                    <div className="flex flex-wrap justify-between gap-2 mb-3">
                      <div>
                        <p className="font-medium">{c.titre}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.niveau.nom} · {c.filiere} · {c.prof?.name}
                        </p>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">{c.codeEtudiant}</Badge>
                    </div>
                    <div className="space-y-1 mb-2">
                      <Progress value={pct} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {effectuees.toFixed(1)}h / {c.heuresPrevues}h ({pct}%)
                      </p>
                    </div>
                    {lastProg && (
                      <p className="text-xs text-muted-foreground">
                        Dernière séance : semaine {lastProg.semaine} —{" "}
                        <span className={
                          lastProg.validation?.status === "VALIDATED" ? "text-green-600" :
                          lastProg.validation?.status === "REFUSED" ? "text-red-600" :
                          "text-orange-600"
                        }>
                          {lastProg.validation?.status || "PENDING"}
                        </span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

