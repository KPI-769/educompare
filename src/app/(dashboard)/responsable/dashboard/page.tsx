import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, BarChart3, Users, TrendingUp } from "lucide-react"

export default async function ResponsableDashboard() {
  const session = await auth()
  const userId = (session?.user as any)?.id
  if (!session || (session.user as any)?.role !== "RESPONSABLE") redirect("/login")

  const dbUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { niveau: true },
  })

  const cours = await prisma.cours.findMany({
    where: dbUser?.niveauId
      ? { niveauId: dbUser.niveauId }
      : {
          niveau: {
            users: { some: { id: userId } },
          },
        },
    include: {
      progressions: true,
      prof: { select: { name: true } },
      niveau: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const totalCours = cours.length
  const totalHeuresPrevues = cours.reduce((s, c) => s + c.heuresPrevues, 0)
  const totalHeuresEffectives = cours.reduce(
    (s, c) => s + c.progressions.reduce((sp, p) => sp + p.heuresEffectives, 0),
    0
  )
  const globalPct = totalHeuresPrevues > 0
    ? Math.round((totalHeuresEffectives / totalHeuresPrevues) * 100)
    : 0

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord Responsable</h1>
          {dbUser?.niveau && (
            <Badge variant="outline" className="text-xs font-semibold border-purple-300 text-purple-700 bg-purple-50">
              🎓 {dbUser.niveau.nom}
            </Badge>
          )}
        </div>
        <p className="text-muted-foreground text-sm mt-0.5">
          {dbUser?.niveau
            ? `Suivi pédagogique synchronisé pour votre niveau : ${dbUser.niveau.nom}`
            : "Suivi de la progression pédagogique"}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total cours</p>
                <p className="text-3xl font-bold">{totalCours}</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Heures effectuées</p>
                <p className="text-3xl font-bold">{totalHeuresEffectives.toFixed(0)}h</p>
              </div>
              <BarChart3 className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avancement global</p>
                <p className="text-3xl font-bold">{globalPct}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses list */}
      <Card>
        <CardHeader>
          <CardTitle>Avancement par cours</CardTitle>
          <CardDescription>Progression détaillée de chaque cours</CardDescription>
        </CardHeader>
        <CardContent>
          {cours.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun cours trouvé.</p>
          ) : (
            <div className="space-y-4">
              {cours.map((c) => {
                const effectuees = c.progressions.reduce((s, p) => s + p.heuresEffectives, 0)
                const pct = c.heuresPrevues > 0
                  ? Math.min(100, Math.round((effectuees / c.heuresPrevues) * 100))
                  : 0
                return (
                  <div key={c.id} className="border rounded-lg p-4">
                    <div className="flex flex-wrap justify-between gap-2 mb-3">
                      <div>
                        <p className="font-medium">{c.titre}</p>
                        <p className="text-xs text-muted-foreground">
                          {c.filiere} · Semestre {c.semestre} · {c.prof?.name || "Prof non assigné"}
                        </p>
                      </div>
                      <div className="flex gap-2 items-start">
                        <Badge variant="outline" className="font-mono text-xs">{c.codeEtudiant}</Badge>
                        <Badge variant={pct >= 75 ? "success" : pct >= 50 ? "warning" : "destructive"} className="text-xs">
                          {pct}%
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Progress value={pct} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {effectuees.toFixed(1)}h effectuées / {c.heuresPrevues}h prévues
                      </p>
                    </div>
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

