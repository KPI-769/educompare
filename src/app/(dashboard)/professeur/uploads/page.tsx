"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { UploadCloud, CheckCircle2, AlertTriangle, FileText, Sparkles, Loader2 } from "lucide-react"

export default function ProfesseurUploadPage() {
  const [coursList, setCoursList] = useState<any[]>([])
  const [selectedCours, setSelectedCours] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [coursText, setCoursText] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/cours")
      .then((r) => r.json())
      .then((data) => setCoursList(data))
      .catch(console.error)
  }, [])

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCours) {
      setError("Veuillez sélectionner un cours")
      return
    }

    setAnalyzing(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/professeur/analyse-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coursId: selectedCours,
          text: coursText || `Support de cours déposé pour la matière : ${file?.name || "document"}`,
          fileName: file?.name || "Support de cours.pdf",
        }),
      })

      const data = await res.json()
      if (res.ok) {
        setResult(data)
      } else {
        setError(data.error || "Erreur lors de l'analyse")
      }
    } catch (err) {
      setError("Échec de communication avec le serveur d'analyse")
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Upload & Analyse de conformité IA</h1>
        <p className="text-gray-500 mt-1">
          Uploadez votre cours et vérifiez automatiquement s&apos;il respecte le syllabus donné à au moins 70%.
        </p>
      </div>

      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Dépôt du support de cours</CardTitle>
          <CardDescription>Format PDF, Word ou saisie du contenu pédagogique</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAnalyze} className="space-y-4">
            <div className="space-y-2">
              <Label>Cours concerné (vos enseignements)</Label>
              {coursList.length === 0 ? (
                <div className="p-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
                  Aucun cours ne vous est actuellement assigné. Vous ne pouvez analyser et comparer que les cours dont vous êtes l&apos;enseignant.
                </div>
              ) : (
                <Select value={selectedCours} onValueChange={setSelectedCours}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez l'un de vos cours..." />
                  </SelectTrigger>
                  <SelectContent>
                    {coursList.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.titre} ({c.filiere} - S{c.semestre})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedCours && (() => {
                const c = coursList.find((item) => item.id === selectedCours)
                return (
                  <div className="text-xs text-gray-500 flex items-center gap-2 pt-1">
                    <span>Syllabus de référence :</span>
                    <Badge variant={c?.syllabus ? "success" : "secondary"}>
                      {c?.syllabus ? "Syllabus officiel configuré" : "Aucun syllabus renseigné par le responsable"}
                    </Badge>
                  </div>
                )
              })()}
            </div>

            <div className="space-y-2">
              <Label>Fichier du cours (PDF / Document)</Label>
              <Input
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </div>

            <div className="space-y-2">
              <Label>Ou collez le texte / résumé du support</Label>
              <textarea
                className="w-full p-2 border rounded-md text-sm"
                rows={4}
                placeholder="Collez ici les thèmes et chapitres abordés dans votre document..."
                value={coursText}
                onChange={(e) => setCoursText(e.target.value)}
              />
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={analyzing || !selectedCours}>
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyse comparative IA en cours...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Lancer l&apos;analyse comparative IA
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (() => {
        const score10 = typeof result.scoreSur10 === "number" ? result.scoreSur10 : Number((result.scoreIA / 10).toFixed(1))
        const estConforme = score10 >= 7.0
        const pct = Math.round(score10 * 10)

        return (
          <Card className="border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-blue-50/30 border-b pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  Résultat de l&apos;Analyse Comparative
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  {result.provider && (
                    <Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-white font-semibold text-xs shadow-xs">
                      ⚡ {result.provider}
                    </Badge>
                  )}
                  <Badge variant={estConforme ? "success" : "destructive"} className="text-sm px-3 py-1 font-bold">
                    Note : {score10} / 10 {estConforme ? "(Conforme ≥ 7/10)" : "(Non conforme < 7/10)"}
                  </Badge>
                </div>
              </div>
              <CardDescription className="mt-1">
                Évaluation automatisée du support de cours par rapport aux objectifs officiels du syllabus
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div>
                <div className="flex justify-between text-sm mb-1.5 font-medium">
                  <span className="text-gray-700">Taux d&apos;alignement au programme officiel</span>
                  <span className={estConforme ? "text-green-700 font-bold" : "text-red-600 font-bold"}>
                    {score10} / 10 ({pct}%)
                  </span>
                </div>
                <Progress value={pct} className="h-3" />
              </div>

              {/* Assistance personnalisée par Gemini */}
              {result.assistancePersonnalisee && (
                <div className="p-4 bg-indigo-50/70 rounded-xl border border-indigo-200 space-y-2">
                  <h4 className="font-semibold text-sm text-indigo-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" /> Assistance Personnalisée & Recommandations Pédagogiques
                  </h4>
                  <p className="text-sm text-indigo-900 leading-relaxed whitespace-pre-line">
                    {result.assistancePersonnalisee}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl space-y-2 border">
                  <h4 className="font-semibold text-sm text-gray-800 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" /> Analyse de cohérence globale
                  </h4>
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{result.analyseIA}</p>
                </div>

                <div className="p-4 bg-amber-50/80 rounded-xl space-y-2 border border-amber-200">
                  <h4 className="font-semibold text-sm text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" /> Ajustements et points manquants recommandés
                  </h4>
                  <p className="text-sm text-amber-900 whitespace-pre-line leading-relaxed">{result.ajustementsIA}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}
    </div>
  )
}

