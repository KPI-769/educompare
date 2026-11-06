"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { PlusCircle, Clock, CheckCircle, Send, BookOpen, Loader2, Sparkles, BookmarkCheck } from "lucide-react"

export default function DelegueProgressionsPage() {
  const [coursList, setCoursList] = useState<any[]>([])
  const [progressions, setProgressions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    coursId: "",
    heureDebut: "",
    heureFin: "",
    partieAtteinte: "",
    chapitreId: "",
    chapitreTitre: "",
    grandTitreId: "",
    grandTitreNom: "",
    heuresEffectives: 2,
    semaine: 1,
    annee: 2026,
    notifEnvoyee: true,
  })

  const fetchData = async () => {
    try {
      const [resC, resP] = await Promise.all([
        fetch("/api/cours"),
        fetch("/api/progressions")
      ])
      if (resC.ok) setCoursList(await resC.json())
      if (resP.ok) setProgressions(await resP.json())
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const selectedCours = coursList.find((c) => c.id === form.coursId)
  const syllabusStructure = selectedCours?.syllabus?.structure
  const chapitres = Array.isArray(syllabusStructure?.chapitres) ? syllabusStructure.chapitres : []

  const handleCoursChange = (coursId: string) => {
    setForm((prev) => ({
      ...prev,
      coursId,
      chapitreId: "",
      chapitreTitre: "",
      grandTitreId: "",
      grandTitreNom: "",
      partieAtteinte: "",
    }))
  }

  const handleChapitreChange = (chapId: string) => {
    const chap = chapitres.find((c: any) => c.id === chapId)
    setForm((prev) => ({
      ...prev,
      chapitreId: chapId,
      chapitreTitre: chap?.titre || "",
      grandTitreId: "",
      grandTitreNom: "",
      partieAtteinte: chap ? `[${chap.titre}] ` : prev.partieAtteinte,
    }))
  }

  const handleGrandTitreChange = (gtId: string) => {
    const chap = chapitres.find((c: any) => c.id === form.chapitreId)
    const gt = chap?.grandsTitres?.find((g: any) => g.id === gtId)
    const gtNom = gt?.titre || ""
    setForm((prev) => ({
      ...prev,
      grandTitreId: gtId,
      grandTitreNom: gtNom,
      partieAtteinte: chap ? `[${chap.titre}] ${gtNom}` : gtNom,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      if (!form.coursId) {
        setError("Veuillez sélectionner un cours.")
        setSubmitting(false)
        return
      }

      if (!form.heureDebut || !form.heureFin) {
        setError("Veuillez renseigner les heures de début et de fin.")
        setSubmitting(false)
        return
      }

      const debut = new Date(form.heureDebut)
      const fin = new Date(form.heureFin)

      if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
        setError("Format de date invalide.")
        setSubmitting(false)
        return
      }

      if (fin <= debut) {
        setError("L'heure de fin doit être postérieure à l'heure de début.")
        setSubmitting(false)
        return
      }

      const diffHours = Math.max(0.5, (fin.getTime() - debut.getTime()) / (1000 * 60 * 60))

      const res = await fetch("/api/progressions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          heureDebut: debut.toISOString(),
          heureFin: fin.toISOString(),
          heuresEffectives: Number(diffHours.toFixed(1)),
          semaine: Number(form.semaine),
          annee: Number(form.annee),
        }),
      })

      if (res.ok) {
        setSuccess("Séance enregistrée ! Notification envoyée aux étudiants et au professeur.")
        setOpen(false)
        setForm({
          coursId: "",
          heureDebut: "",
          heureFin: "",
          partieAtteinte: "",
          chapitreId: "",
          chapitreTitre: "",
          grandTitreId: "",
          grandTitreNom: "",
          heuresEffectives: 2,
          semaine: 1,
          annee: 2026,
          notifEnvoyee: true,
        })
        fetchData()
      } else {
        const data = await res.json()
        if (typeof data.error === "string") {
          setError(data.error)
        } else if (Array.isArray(data.error)) {
          setError(data.error.map((issue: any) => issue.message || "Erreur de validation").join(" • "))
        } else {
          setError("Erreur de validation. Veuillez vérifier vos données.")
        }
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Renseignement des cours</h1>
          <p className="text-gray-500 mt-1">Déclarez les heures effectuées et l&apos;avancement exact selon le syllabus</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <PlusCircle className="w-4 h-4 mr-2" />
              Déclarer une séance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Déclaration de progression de cours</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              {/* Sélection du cours */}
              <div className="space-y-2">
                <Label>Cours concerné</Label>
                {coursList.length === 0 ? (
                  <div className="p-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md">
                    Aucun cours disponible pour le moment. Veuillez demander au responsable de créer vos cours.
                  </div>
                ) : (
                  <Select value={form.coursId} onValueChange={handleCoursChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un cours" />
                    </SelectTrigger>
                    <SelectContent>
                      {coursList.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.titre} ({c.filiere} - Semestre {c.semestre})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* SÉLECTION DU POINT D'ARRÊT DANS LE SYLLABUS STRUCTURÉ */}
              {selectedCours && chapitres.length > 0 && (
                <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Point d&apos;arrêt selon le Syllabus officiel
                    </Label>
                    <Badge variant="outline" className="text-[10px] bg-white text-indigo-700 border-indigo-300">
                      {chapitres.length} chapitres définis
                    </Badge>
                  </div>

                  {/* 1. Sélection du chapitre */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-700">1. Chapitre abordé</Label>
                    <Select value={form.chapitreId} onValueChange={handleChapitreChange}>
                      <SelectTrigger className="bg-white text-xs">
                        <SelectValue placeholder="Choisir le chapitre du syllabus" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapitres.map((ch: any) => (
                          <SelectItem key={ch.id} value={ch.id} className="text-xs">
                            {ch.titre} ({ch.heuresEstimees || 6}h prévues)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 2. Sélection du grand titre / point d'arrêt */}
                  {form.chapitreId && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold text-gray-700">
                        2. Grand Titre où la séance s&apos;est arrêtée
                      </Label>
                      <Select value={form.grandTitreId} onValueChange={handleGrandTitreChange}>
                        <SelectTrigger className="bg-white text-xs">
                          <SelectValue placeholder="Choisir le grand titre / section atteinte" />
                        </SelectTrigger>
                        <SelectContent>
                          {chapitres
                            .find((c: any) => c.id === form.chapitreId)
                            ?.grandsTitres?.map((gt: any) => (
                              <SelectItem key={gt.id} value={gt.id} className="text-xs">
                                {gt.titre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              )}

              {/* Heures début et fin */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heure de début</Label>
                  <Input
                    type="datetime-local"
                    value={form.heureDebut}
                    onChange={(e) => setForm({ ...form, heureDebut: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heure de fin</Label>
                  <Input
                    type="datetime-local"
                    value={form.heureFin}
                    onChange={(e) => setForm({ ...form, heureFin: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Semaine et Année */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Semaine N°</Label>
                  <Input
                    type="number"
                    min="1"
                    max="52"
                    value={form.semaine}
                    onChange={(e) => setForm({ ...form, semaine: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Année</Label>
                  <Input
                    type="number"
                    value={form.annee}
                    onChange={(e) => setForm({ ...form, annee: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              {/* Champ texte libre pour précisions supplémentaires */}
              <div className="space-y-2">
                <Label>Précisions sur la partie atteinte (exercices, remarques)</Label>
                <Textarea
                  placeholder="Ex: Chapitre 2 - Section 2.3 : Les requêtes SQL jointures terminées. Exercice 4 en cours."
                  rows={3}
                  value={form.partieAtteinte}
                  onChange={(e) => setForm({ ...form, partieAtteinte: e.target.value })}
                  required
                />
                {form.grandTitreNom && (
                  <p className="text-[11px] text-indigo-700 flex items-center gap-1">
                    <BookmarkCheck className="w-3.5 h-3.5" /> Point d&apos;arrêt officiel : {form.grandTitreNom}
                  </p>
                )}
              </div>

              <div className="p-3 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-start gap-2">
                <Send className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  L&apos;enregistrement enverra automatiquement une notification en temps réel aux étudiants
                  et soumettra la séance à la validation du professeur.
                </span>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer et notifier
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && <Alert variant="success"><AlertDescription>{success}</AlertDescription></Alert>}

      <Card>
        <CardHeader>
          <CardTitle>Historique des séances renseignées</CardTitle>
          <CardDescription>Suivi des validations par le professeur et conformité avec le syllabus</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-blue-600" /></div>
          ) : progressions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              Aucune séance renseignée pour l&apos;instant.
            </div>
          ) : (
            <div className="space-y-4">
              {progressions.map((prog) => (
                <div key={prog.id} className="p-4 border rounded-xl bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-gray-900">{prog.cours?.titre}</span>
                      <Badge variant="outline">Semaine {prog.semaine}</Badge>
                      <Badge variant={prog.validation?.status === "VALIDATED" ? "success" : prog.validation?.status === "REFUSED" ? "destructive" : "warning"}>
                        {prog.validation?.status === "VALIDATED" ? "Confirmé par Prof" : prog.validation?.status === "REFUSED" ? "Refusé par Prof" : "En attente Prof"}
                      </Badge>
                    </div>

                    {/* Point d'arrêt syllabus structuré s'il existe */}
                    {(prog.chapitreTitre || prog.grandTitreNom) && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                        <span>{prog.chapitreTitre} {prog.grandTitreNom ? `› ${prog.grandTitreNom}` : ""}</span>
                      </div>
                    )}

                    <p className="text-sm text-gray-700 font-medium">Arrêt déclaré : {prog.partieAtteinte}</p>
                    <p className="text-xs text-gray-400">
                      Du {new Date(prog.heureDebut).toLocaleString()} au {new Date(prog.heureFin).toLocaleTimeString()} ({prog.heuresEffectives}h)
                    </p>
                    {prog.validation?.commentaire && (
                      <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded mt-1">
                        Remarque du prof: {prog.validation.commentaire}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Code cours : <strong className="font-mono text-gray-700">{prog.cours?.codeEtudiant}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
