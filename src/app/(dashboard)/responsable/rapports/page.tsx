"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileText, Download, Share2, MessageSquare, Loader2, Sparkles, CheckCircle2 } from "lucide-react"
import { generateReportPDF } from "@/lib/pdf-report"

export default function ResponsableRapportsPage() {
  const { data: session } = useSession()
  const [semaine, setSemaine] = useState(1)
  const [annee, setAnnee] = useState(2026)
  const [commentaire, setCommentaire] = useState("")
  const [generating, setGenerating] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [partageSuccess, setPartageSuccess] = useState(false)
  const [coursStats, setCoursStats] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/cours")
      .then((r) => r.json())
      .then((data) => setCoursStats(data))
      .catch(console.error)
  }, [])

  const handleShareAdmin = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/responsable/rapports/partager", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semaine,
          annee,
          commentaire,
        }),
      })
      if (res.ok) {
        setPartageSuccess(true)
        setTimeout(() => setPartageSuccess(false), 4000)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setGenerating(false)
    }
  }

  // TÉLÉCHARGEMENT DIRECT ET PROPRE DU FICHIER PDF (SANS window.print)
  const handleDownloadPDF = () => {
    setExportingPdf(true)
    try {
      generateReportPDF({
        semaine,
        annee,
        commentaire,
        coursList: coursStats,
        responsableName: session?.user?.name ? `Responsable : ${session.user.name}` : "Direction Pédagogique",
      })
    } catch (err) {
      console.error("Erreur lors de la génération PDF :", err)
    } finally {
      setTimeout(() => setExportingPdf(false), 800)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Rapports Hebdomadaires</h1>
          <p className="text-gray-500 mt-1">
            Génération, téléchargement PDF officiel et partage direct avec l&apos;administration
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            onClick={handleDownloadPDF}
            disabled={exportingPdf}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
          >
            {exportingPdf ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Télécharger PDF (.pdf)
          </Button>
          <Button
            variant="outline"
            onClick={handleShareAdmin}
            disabled={generating}
            className="w-full sm:w-auto border-gray-300"
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4 mr-2 text-indigo-600" />}
            Partager avec l&apos;Administration
          </Button>
        </div>
      </div>

      {partageSuccess && (
        <Alert variant="success">
          <AlertDescription>
            Rapport hebdomadaire et commentaires partagés avec succès avec le Super Admin !
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Configuration de la période & Commentaires</CardTitle>
          <CardDescription>Ajoutez votre appréciation globale sur les performances de la filière pour le rapport</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Semaine N°</Label>
              <Input
                type="number"
                min="1"
                max="52"
                value={semaine}
                onChange={(e) => setSemaine(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Année</Label>
              <Input
                type="number"
                value={annee}
                onChange={(e) => setAnnee(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              Commentaires personnalisés du Responsable de Filière
            </Label>
            <Textarea
              placeholder="Ex: L'avancement global est satisfaisant. Une vigilance particulière est requise sur le cours de Mathématiques où deux séances de rattrapage ont été prévues..."
              rows={4}
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
            <p className="text-[11px] text-gray-500">
              Ces observations seront automatiquement intégrées dans l&apos;encadré officiel du PDF généré.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vue Synthèse à l'écran */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader className="border-b pb-4 bg-slate-50/50 rounded-t-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] uppercase font-bold tracking-wider text-blue-600">EduCompare Official Report</span>
              <CardTitle className="text-xl">Aperçu du Rapport de Synthèse</CardTitle>
              <CardDescription>Semaine {semaine} • Année {annee}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-white text-slate-700">Format A4 Prêt</Badge>
              <Button size="sm" variant="ghost" className="text-xs text-blue-600 hover:text-blue-800" onClick={handleDownloadPDF}>
                <Download className="w-3.5 h-3.5 mr-1" />
                Générer PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {commentaire && (
            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Note de la Direction Pédagogique
              </h4>
              <p className="text-sm text-gray-800 italic">&quot;{commentaire}&quot;</p>
            </div>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase">
                  <th className="p-3">Matière / Cours</th>
                  <th className="p-3">Filière</th>
                  <th className="p-3">Enseignant</th>
                  <th className="p-3 text-center">Prévues</th>
                  <th className="p-3 text-center">Validées</th>
                  <th className="p-3 text-center">Taux</th>
                </tr>
              </thead>
              <tbody className="divide-y text-gray-700">
                {coursStats.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-400">
                      Aucun cours disponible pour cette période
                    </td>
                  </tr>
                ) : (
                  coursStats.map((c) => {
                    const validated = (c.progressions || []).filter((p: any) => p.validation?.status === "VALIDATED")
                    const hValidees = validated.reduce((s: number, p: any) => s + (p.heuresEffectives || 0), 0)
                    const pct = Math.min(100, Math.round((hValidees / (c.heuresPrevues || 1)) * 100))

                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-semibold text-gray-900">{c.titre}</td>
                        <td className="p-3 text-xs">{c.filiere} (S{c.semestre})</td>
                        <td className="p-3 text-xs">{c.prof?.name || "—"}</td>
                        <td className="p-3 text-center font-mono text-xs">{c.heuresPrevues}h</td>
                        <td className="p-3 text-center font-mono text-xs font-bold text-blue-700">{hValidees}h</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${pct >= 50 ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
