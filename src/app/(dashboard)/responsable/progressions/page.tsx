"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Send,
  Loader2,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  CheckCircle2,
  CircleDot,
  Layers,
} from "lucide-react"

export default function ResponsableProgressionPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [alertSent, setAlertSent] = useState<string | null>(null)
  const [expandedSyllabus, setExpandedSyllabus] = useState<Record<string, boolean>>({})
  const [structuringId, setStructuringId] = useState<string | null>(null)

  const loadData = () => {
    fetch("/api/cours")
      .then((r) => r.json())
      .then((coursList) => {
        // Calcul des évolutions, retards et métriques syllabus par heure
        const calculated = coursList.map((c: any) => {
          const allProgressions = c.progressions || []
          const validatedProgressions = allProgressions.filter(
            (p: any) => p.validation?.status === "VALIDATED"
          )
          const totalHeuresEffectives = validatedProgressions.reduce(
            (acc: number, p: any) => acc + (p.heuresEffectives || 0),
            0
          )
          const taux = Math.min(100, Math.round((totalHeuresEffectives / (c.heuresPrevues || 1)) * 100))

          // Hypothèse : semestre standard sur 12 semaines
          const semainesPassees = Math.max(1, new Set(validatedProgressions.map((p: any) => p.semaine)).size)
          const cadenceMoyenneParSemaine = totalHeuresEffectives / semainesPassees
          const heuresRestantes = Math.max(0, c.heuresPrevues - totalHeuresEffectives)
          const semainesRestantesEstimees = 12 - semainesPassees

          const besoinHeuresParSemaine = semainesRestantesEstimees > 0 ? (heuresRestantes / semainesRestantesEstimees) : 0
          const enRetard = semainesPassees >= 3 && cadenceMoyenneParSemaine < (c.heuresPrevues / 12) * 0.75

          // Dernier point d'arrêt déclaré
          const derniereProgression = allProgressions[0] || null

          // Calcul de la progression par chapitre du syllabus avec la règle :
          // "Lorsqu'on fait un point d'arrêt, tous les chapitres précédents sont marqués comme terminés"
          const chapitres = Array.isArray(c.syllabus?.structure?.chapitres) ? c.syllabus.structure.chapitres : []

          // 1. Trouver le point d'arrêt le plus avancé
          let activeChapIdx = -1
          let activeGtIdx = -1

          allProgressions.forEach((p: any) => {
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

          // 2. Définir le statut de chaque chapitre et grand titre
          const chapitresAvancement = chapitres.map((chap: any, idx: number) => {
            const heuresEstimees = Number(chap.heuresEstimees) || Math.max(4, Math.round(c.heuresPrevues / chapitres.length))
            const grandsTitres = Array.isArray(chap.grandsTitres) ? chap.grandsTitres : []

            // A. TOUS LES CHAPITRES PRÉCÉDENTS SONT MARQUÉS COMME TERMINÉS (100%)
            if (activeChapIdx >= 0 && idx < activeChapIdx) {
              return {
                ...chap,
                heuresEstimees,
                heuresRealisees: heuresEstimees,
                tauxChapitre: 100,
                status: "COMPLETED",
                grandsTitres: grandsTitres.map((gt: any) => ({
                  ...gt,
                  isReached: true,
                  isCurrent: false,
                })),
              }
            }

            // B. LE CHAPITRE DU POINT D'ARRÊT ACTUEL
            if (activeChapIdx >= 0 && idx === activeChapIdx) {
              const isLastGtReached = grandsTitres.length > 0 && activeGtIdx >= grandsTitres.length - 1
              const tauxChap = isLastGtReached
                ? 100
                : Math.max(20, Math.min(90, Math.round(((activeGtIdx + 1) / Math.max(1, grandsTitres.length)) * 100)))

              const gtWithStatus = grandsTitres.map((gt: any, gIdx: number) => {
                const isCurrent = gIdx === activeGtIdx
                const isReached = activeGtIdx >= 0 ? gIdx <= activeGtIdx : false
                return {
                  ...gt,
                  isReached,
                  isCurrent,
                }
              })

              return {
                ...chap,
                heuresEstimees,
                heuresRealisees: Number(((tauxChap / 100) * heuresEstimees).toFixed(1)),
                tauxChapitre: tauxChap,
                status: isLastGtReached ? "COMPLETED" : "IN_PROGRESS",
                grandsTitres: gtWithStatus,
              }
            }

            // C. LES CHAPITRES SUIVANTS (NON ENCORE DÉBUTÉS)
            return {
              ...chap,
              heuresEstimees,
              heuresRealisees: 0,
              tauxChapitre: 0,
              status: "NOT_STARTED",
              grandsTitres: grandsTitres.map((gt: any) => ({
                ...gt,
                isReached: false,
                isCurrent: false,
              })),
            }
          })

          return {
            ...c,
            totalHeuresEffectives,
            taux,
            cadenceMoyenneParSemaine: Number(cadenceMoyenneParSemaine.toFixed(1)),
            besoinHeuresParSemaine: Number(besoinHeuresParSemaine.toFixed(1)),
            enRetard,
            derniereProgression,
            chapitresAvancement,
          }
        })
        setData(calculated)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleSyllabus = (coursId: string) => {
    setExpandedSyllabus((prev) => ({ ...prev, [coursId]: !prev[coursId] }))
  }

  const handleStructureWithAI = async (cours: any) => {
    if (!cours.syllabus?.contenu) return
    setStructuringId(cours.id)
    try {
      const res = await fetch(`/api/cours/${cours.id}/syllabus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenu: cours.syllabus.contenu,
          autoStructure: true,
        }),
      })
      if (res.ok) {
        loadData()
        setExpandedSyllabus((prev) => ({ ...prev, [cours.id]: true }))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setStructuringId(null)
    }
  }

  const sendAlerteProf = async (cours: any) => {
    setAlertSent(cours.id)
    try {
      await fetch("/api/responsable/alerte-prof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coursId: cours.id,
          profEmail: cours.prof?.email,
          profName: cours.prof?.name,
          coursTitre: cours.titre,
          taux: cours.taux,
          cadence: cours.cadenceMoyenneParSemaine,
        }),
      })
    } catch (e) {
      console.error(e)
    } finally {
      setTimeout(() => setAlertSent(null), 3000)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Suivi de l&apos;Évolution par Heure & Syllabus
        </h1>
        <p className="text-gray-500 mt-1">
          Visualisez l&apos;avancement en heures par rapport au syllabus. Chaque point d&apos;arrêt marque automatiquement tous les chapitres précédents comme terminés.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="space-y-6">
          {data.map((c) => {
            const hasSyllabusStructure = c.chapitresAvancement && c.chapitresAvancement.length > 0
            const isExpanded = !!expandedSyllabus[c.id]

            return (
              <Card key={c.id} className={c.enRetard ? "border-amber-300 bg-amber-50/10 shadow-sm" : "shadow-sm"}>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {c.titre}
                        <Badge variant="outline">{c.filiere} • S{c.semestre}</Badge>
                      </CardTitle>
                      <CardDescription>
                        Professeur : {c.prof?.name || "Non assigné"} • Délégué : {c.delegue?.name || "Non assigné"}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.enRetard ? (
                        <Badge variant="warning" className="flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Risque de dépassement
                        </Badge>
                      ) : (
                        <Badge variant="success" className="flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> Dans les temps
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* BARRE D'AVANCEMENT EN HEURES PAR RAPPORT AU SYLLABUS */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className="text-gray-800">
                        Heures enseignées : <strong className="text-blue-700">{c.totalHeuresEffectives}h</strong> / {c.heuresPrevues}h prévues au syllabus
                      </span>
                      <span className="font-mono text-sm text-blue-700">{c.taux}%</span>
                    </div>
                    <Progress value={c.taux} className="h-2.5" />
                  </div>

                  {/* DERNIER POINT D'ARRÊT DÉCLARÉ PAR LE DÉLÉGUÉ */}
                  {c.derniereProgression && (
                    <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <BookmarkCheck className="w-4 h-4 text-indigo-700 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-bold text-indigo-950">
                            Point d&apos;arrêt actuel (Semaine {c.derniereProgression.semaine}) :
                          </p>
                          <p className="text-xs text-indigo-800 font-medium">
                            {c.derniereProgression.chapitreTitre ? (
                              <span>
                                <strong>{c.derniereProgression.chapitreTitre}</strong>
                                {c.derniereProgression.grandTitreNom && ` › ${c.derniereProgression.grandTitreNom}`}
                              </span>
                            ) : (
                              c.derniereProgression.partieAtteinte
                            )}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[11px] bg-white text-indigo-700 self-start sm:self-center flex-shrink-0">
                        {c.derniereProgression.heuresEffectives}h sur la séance
                      </Badge>
                    </div>
                  )}

                  {/* CADENCE ET RYTHME PRÉDICTIF */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-700">
                    <div>
                      <span className="text-gray-400 block">Rythme actuel moyen :</span>
                      <strong className="text-sm font-semibold">{c.cadenceMoyenneParSemaine}h / semaine</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Rythme requis pour finir :</span>
                      <strong className="text-sm font-semibold">{c.besoinHeuresParSemaine}h / semaine</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block">Prédiction fin de programme :</span>
                      <strong className={c.enRetard ? "text-amber-700 font-bold" : "text-green-700 font-bold"}>
                        {c.enRetard ? "Retard critique prévisible" : "Objectif atteignable"}
                      </strong>
                    </div>
                  </div>

                  {/* ALERTE AUTOMATIQUE EN RETARD */}
                  {c.enRetard && (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 border border-amber-200 bg-amber-50 rounded-xl">
                      <p className="text-xs text-amber-900">
                        <strong>Alerte automatique :</strong> Avec l&apos;avancement moyen actuel, le professeur risque de ne pas achever l&apos;intégralité des chapitres du syllabus dans les délais.
                      </p>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="whitespace-nowrap flex-shrink-0"
                        onClick={() => sendAlerteProf(c)}
                        disabled={alertSent === c.id}
                      >
                        <Send className="w-3.5 h-3.5 mr-1" />
                        {alertSent === c.id ? "Alerte envoyée !" : "Envoyer alerte au prof"}
                      </Button>
                    </div>
                  )}

                  {/* MODULE ÉVOLUTION DÉTAILLÉE PAR HEURE EN FONCTION DU SYLLABUS */}
                  <div className="pt-2 border-t">
                    {hasSyllabusStructure ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-0 h-auto text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1.5"
                            onClick={() => toggleSyllabus(c.id)}
                          >
                            <Layers className="w-4 h-4 text-indigo-600" />
                            <span>
                              {isExpanded ? "Masquer" : "Afficher"} la couverture détaillée du Syllabus par heure ({c.chapitresAvancement.length} chapitres)
                            </span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </Button>
                          <Badge variant="outline" className="text-[10px] text-gray-500">
                            {c.totalHeuresEffectives}h réalisées / {c.heuresPrevues}h prévues
                          </Badge>
                        </div>

                        {isExpanded && (
                          <div className="space-y-3 pt-2">
                            {c.chapitresAvancement.map((chap: any, idx: number) => {
                              const isTermine = chap.status === "COMPLETED" || chap.tauxChapitre >= 100
                              const isEnCours = chap.status === "IN_PROGRESS"
                              return (
                                <div
                                  key={chap.id || idx}
                                  className={`p-3.5 rounded-xl border text-xs space-y-2.5 transition-colors ${
                                    isTermine
                                      ? "bg-green-50/50 border-green-200"
                                      : isEnCours
                                      ? "bg-indigo-50/50 border-indigo-200 shadow-xs ring-1 ring-indigo-200"
                                      : "bg-white border-gray-200 opacity-75"
                                  }`}
                                >
                                  {/* Entête du chapitre avec compteurs d'heures */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                          isTermine
                                            ? "bg-green-600 text-white"
                                            : isEnCours
                                            ? "bg-indigo-600 text-white"
                                            : "bg-gray-100 text-gray-600"
                                        }`}
                                      >
                                        {isTermine ? "✓" : (chap.numero || idx + 1)}
                                      </span>
                                      <span className="font-bold text-gray-900 text-sm">{chap.titre}</span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-gray-600">
                                        <strong>{chap.heuresRealisees}h</strong> validées / {chap.heuresEstimees}h prévues
                                      </span>
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
                                        {isTermine ? "Terminé (100%)" : isEnCours ? "En cours" : "Non débuté"}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Barre de progression du chapitre */}
                                  <Progress value={chap.tauxChapitre} className="h-1.5" />

                                  {/* Liste des Grands Titres / Sections avec statut */}
                                  {chap.grandsTitres && chap.grandsTitres.length > 0 && (
                                    <div className="pl-8 pt-1 space-y-1.5">
                                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                        Grands Titres / Sections du syllabus :
                                      </p>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                                        {chap.grandsTitres.map((gt: any, gIdx: number) => (
                                          <div
                                            key={gt.id || gIdx}
                                            className={`p-2 rounded-lg flex items-center justify-between text-xs border ${
                                              gt.isCurrent
                                                ? "bg-indigo-100 border-indigo-300 text-indigo-950 font-bold ring-1 ring-indigo-400"
                                                : gt.isReached
                                                ? "bg-green-50/80 border-green-200 text-green-900"
                                                : "bg-gray-50 border-gray-100 text-gray-400"
                                            }`}
                                          >
                                            <div className="flex items-center gap-1.5 truncate pr-2">
                                              {gt.isReached ? (
                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                              ) : (
                                                <CircleDot className="w-3.5 h-3.5 text-gray-300 flex-shrink-0" />
                                              )}
                                              <span className="truncate">{gt.titre}</span>
                                            </div>

                                            {gt.isCurrent && (
                                              <Badge variant="outline" className="text-[9px] bg-white text-indigo-800 border-indigo-400 flex-shrink-0 font-bold">
                                                🎯 Arrêt actuel
                                              </Badge>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    ) : c.syllabus?.contenu ? (
                      <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-indigo-900">
                          <p className="font-semibold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            Syllabus disponible en texte brut
                          </p>
                          <p className="text-gray-500 mt-0.5">
                            Structurez ce syllabus avec l&apos;IA pour activer le suivi automatique par chapitre et grand titre.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs bg-white text-indigo-700 hover:bg-indigo-50 border-indigo-300 flex-shrink-0"
                          onClick={() => handleStructureWithAI(c)}
                          disabled={structuringId === c.id}
                        >
                          {structuringId === c.id ? (
                            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                          ) : (
                            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                          )}
                          Structurer avec Gemini IA
                        </Button>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic">
                        Aucun syllabus renseigné pour ce cours. Veuillez en configurer un dans l&apos;onglet &quot;Cours &amp; Syllabus&quot;.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
