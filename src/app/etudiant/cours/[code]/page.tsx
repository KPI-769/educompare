"use client"
import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BookOpen, Clock, User, Calendar, ArrowLeft, CheckCircle2, CircleDot, Sparkles, Layers } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface Cours {
  id: string
  titre: string
  description: string
  heuresPrevues: number
  filiere: string
  semestre: number
  codeEtudiant: string
  niveau: { nom: string }
  prof: { name: string } | null
  syllabus: { contenu: string; structure?: any } | null
  progressions: Array<{
    id: string
    heureDebut: string
    heureFin: string
    partieAtteinte: string
    chapitreId?: string
    chapitreTitre?: string
    grandTitreId?: string
    grandTitreNom?: string
    heuresEffectives: number
    semaine: number
    annee: number
  }>
}

export default function EtudiantCoursPage() {
  const params = useParams()
  const code = params.code as string
  const [cours, setCours] = useState<Cours | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch(`/api/etudiant/cours?code=${code}`)
      .then((r) => {
        if (!r.ok) throw new Error("Cours introuvable")
        return r.json()
      })
      .then(setCours)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (error || !cours) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-red-500 mb-4">{error || "Cours introuvable"}</p>
            <Link href="/etudiant/acces">
              <Button variant="outline">Retour</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const heuresEffectuees = cours.progressions.reduce((s, p) => s + p.heuresEffectives, 0)
  const pourcentage = Math.min(100, Math.round((heuresEffectuees / cours.heuresPrevues) * 100))

  // Calcul du point d'arrêt dans le syllabus :
  // Tous les chapitres précédant le point d'arrêt sont marqués comme TERMINÉS
  const chapitres = Array.isArray(cours.syllabus?.structure?.chapitres) ? cours.syllabus.structure.chapitres : []
  let activeChapIdx = -1
  let activeGtIdx = -1

  cours.progressions.forEach((p) => {
    let pChapIdx = -1
    let pGtIdx = -1

    chapitres.forEach((ch: any, cIdx: number) => {
      const matchId = p.chapitreId && p.chapitreId === ch.id
      const matchTitre = p.chapitreTitre && ch.titre && (
        p.chapitreTitre.toLowerCase().includes(ch.titre.toLowerCase()) ||
        ch.titre.toLowerCase().includes(p.chapitreTitre.toLowerCase())
      )
      const matchPartie = p.partieAtteinte && (
        (ch.titre && p.partieAtteinte.toLowerCase().includes(ch.titre.toLowerCase())) ||
        new RegExp(`chapitre\\s*0*${ch.numero}\\b`, "i").test(p.partieAtteinte)
      )

      if (matchId || matchTitre || matchPartie) {
        pChapIdx = cIdx

        if (Array.isArray(ch.grandsTitres)) {
          ch.grandsTitres.forEach((gt: any, gIdx: number) => {
            const matchGtId = p.grandTitreId && p.grandTitreId === gt.id
            const matchGtNom = p.grandTitreNom && gt.titre && (
              p.grandTitreNom.toLowerCase().includes(gt.titre.toLowerCase()) ||
              gt.titre.toLowerCase().includes(p.grandTitreNom.toLowerCase())
            )
            const matchGtPartie = p.partieAtteinte && gt.titre && p.partieAtteinte.toLowerCase().includes(gt.titre.toLowerCase())

            if (matchGtId || matchGtNom || matchGtPartie) {
              pGtIdx = Math.max(pGtIdx, gIdx)
            }
          })
        }
      }
    })

    if (pChapIdx > activeChapIdx || (pChapIdx === activeChapIdx && pGtIdx > activeGtIdx)) {
      activeChapIdx = pChapIdx
      activeGtIdx = pGtIdx
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/etudiant/acces">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-blue-900">EduCompare</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Course Header */}
        <Card>
          <CardHeader>
            <div className="flex flex-wrap gap-2 mb-2">
              <Badge variant="secondary">{cours.niveau.nom}</Badge>
              <Badge variant="outline">Semestre {cours.semestre}</Badge>
              <Badge variant="outline">{cours.filiere}</Badge>
              <Badge className="font-mono">{cours.codeEtudiant}</Badge>
            </div>
            <CardTitle className="text-2xl">{cours.titre}</CardTitle>
            {cours.description && (
              <CardDescription>{cours.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{cours.heuresPrevues}h prévues</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>{cours.prof?.name || "Prof non assigné"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{cours.progressions.length} séances dispensées</span>
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progression globale</span>
                <span className="text-muted-foreground">
                  {heuresEffectuees.toFixed(1)}h / {cours.heuresPrevues}h ({pourcentage}%)
                </span>
              </div>
              <Progress value={pourcentage} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {pourcentage >= 100
                  ? "✅ Cours terminé"
                  : pourcentage >= 75
                  ? "🟢 Avancement satisfaisant"
                  : pourcentage >= 50
                  ? "🟡 En cours"
                  : "🔴 Avancement faible"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PROGRESSION STRUCTURÉE DU SYLLABUS */}
        {chapitres.length > 0 && (
          <Card className="border-indigo-100 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  Progression du Syllabus par Chapitre
                </CardTitle>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 text-xs">
                  {chapitres.length} chapitres
                </Badge>
              </div>
              <CardDescription>
                Avancement officiel selon les séances déclarées. Les chapitres précédant le point d&apos;arrêt sont validés.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {chapitres.map((chap: any, idx: number) => {
                const isTermine = activeChapIdx >= 0 && idx < activeChapIdx
                const isEnCours = activeChapIdx >= 0 && idx === activeChapIdx
                const isNonDebute = activeChapIdx < 0 || idx > activeChapIdx
                const grandsTitres = Array.isArray(chap.grandsTitres) ? chap.grandsTitres : []

                return (
                  <div
                    key={chap.id || idx}
                    className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-colors ${
                      isTermine
                        ? "bg-green-50/50 border-green-200"
                        : isEnCours
                        ? "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200"
                        : "bg-white border-gray-100 opacity-70"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            isTermine
                              ? "bg-green-600 text-white"
                              : isEnCours
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {isTermine ? "✓" : (chap.numero || idx + 1)}
                        </span>
                        <span className="font-bold text-gray-900 text-sm">{chap.titre}</span>
                      </div>

                      <Badge
                        variant={isTermine ? "success" : isEnCours ? "default" : "secondary"}
                        className={`text-[10px] ${
                          isTermine
                            ? "bg-green-100 text-green-800 border-green-200"
                            : isEnCours
                            ? "bg-indigo-100 text-indigo-800 border-indigo-200"
                            : ""
                        }`}
                      >
                        {isTermine ? "Terminé (100%)" : isEnCours ? "En cours" : "À venir"}
                      </Badge>
                    </div>

                    {grandsTitres.length > 0 && (
                      <div className="pl-8 pt-1 space-y-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {grandsTitres.map((gt: any, gIdx: number) => {
                            const isCurrent = isEnCours && gIdx === activeGtIdx
                            const isReached = isTermine || (isEnCours && gIdx <= activeGtIdx)

                            return (
                              <div
                                key={gt.id || gIdx}
                                className={`p-1.5 rounded-md flex items-center justify-between text-xs border ${
                                  isCurrent
                                    ? "bg-indigo-100 border-indigo-300 text-indigo-950 font-bold"
                                    : isReached
                                    ? "bg-green-50/80 border-green-200 text-green-900"
                                    : "bg-gray-50 border-gray-100 text-gray-400"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 truncate pr-1">
                                  {isReached ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <CircleDot className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                  )}
                                  <span className="truncate">{gt.titre}</span>
                                </div>
                                {isCurrent && (
                                  <span className="text-[9px] bg-white text-indigo-800 border border-indigo-300 px-1 py-0.5 rounded font-bold flex-shrink-0">
                                    Arrêt
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Progressions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Historique des séances</CardTitle>
            <CardDescription>Dernières séances enregistrées par le délégué</CardDescription>
          </CardHeader>
          <CardContent>
            {cours.progressions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Aucune séance enregistrée pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {cours.progressions.map((p) => (
                  <div key={p.id} className="border rounded-xl p-4 bg-gray-50/60 shadow-2xs space-y-1.5">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        Semaine {p.semaine} — {p.annee}
                      </span>
                      <Badge variant="outline" className="text-xs bg-white">
                        {p.heuresEffectives}h effectuées
                      </Badge>
                    </div>

                    {(p.chapitreTitre || p.grandTitreNom) && (
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>{p.chapitreTitre} {p.grandTitreNom ? `› ${p.grandTitreNom}` : ""}</span>
                      </div>
                    )}

                    <p className="text-sm text-gray-700 font-medium">{p.partieAtteinte}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.heureDebut).toLocaleDateString("fr-FR", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}{" "}
                      · {new Date(p.heureDebut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} —{" "}
                      {new Date(p.heureFin).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Syllabus brut si présent */}
        {cours.syllabus && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Texte officiel du syllabus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-muted-foreground">
                {cours.syllabus.contenu}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
