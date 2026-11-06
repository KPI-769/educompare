"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, PlusCircle, FileText, Loader2, Sparkles, CheckCircle2, ChevronRight, Layers } from "lucide-react"

export default function ResponsableCoursPage() {
  const [cours, setCours] = useState<any[]>([])
  const [niveaux, setNiveaux] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [structuringAI, setStructuringAI] = useState(false)
  const [structuredPreview, setStructuredPreview] = useState<any | null>(null)
  const [aiProvider, setAiProvider] = useState<string>("")
  const [viewingSyllabusCours, setViewingSyllabusCours] = useState<any | null>(null)
  const [structuringCoursId, setStructuringCoursId] = useState<string | null>(null)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({
    titre: "",
    description: "",
    heuresPrevues: 40,
    filiere: "",
    semestre: 1,
    niveauId: "",
    profId: "",
    delegueId: "",
    syllabusContenu: "",
  })

  const loadData = async () => {
    try {
      const [resC, resN, resU] = await Promise.all([
        fetch("/api/cours"),
        fetch("/api/niveaux"),
        fetch("/api/users"),
      ])
      if (resC.ok) setCours(await resC.json())
      if (resN.ok) {
        const nList = await resN.json()
        setNiveaux(nList)
        if (nList.length > 0) {
          setForm((prev) => ({ ...prev, niveauId: prev.niveauId || nList[0].id }))
        }
      }
      if (resU.ok) setUsers(await resU.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleStructureWithAI = async () => {
    if (!form.syllabusContenu || form.syllabusContenu.trim().length < 5) {
      setError("Veuillez renseigner le contenu du syllabus à faire structurer par l'IA.")
      return
    }

    setStructuringAI(true)
    setError("")

    try {
      const res = await fetch("/api/syllabus/structurer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: form.syllabusContenu,
          titreCours: form.titre,
          heuresPrevues: form.heuresPrevues,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setStructuredPreview(data.structure)
        setAiProvider(data.provider || "Gemini AI")
      } else {
        const err = await res.json()
        setError(err.error || "Erreur de structuration IA")
      }
    } catch (err) {
      setError("Erreur de connexion au service d'IA")
    } finally {
      setStructuringAI(false)
    }
  }

  const handleStructureExistingCours = async (c: any) => {
    if (!c.syllabus?.contenu) return
    setStructuringCoursId(c.id)
    try {
      const res = await fetch(`/api/cours/${c.id}/syllabus`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contenu: c.syllabus.contenu,
          autoStructure: true,
        }),
      })
      if (res.ok) {
        setSuccess(`Syllabus du cours "${c.titre}" structuré avec succès par l'IA !`)
        loadData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setStructuringCoursId(null)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/cours", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titre: form.titre,
          description: form.description,
          heuresPrevues: Number(form.heuresPrevues),
          filiere: form.filiere,
          semestre: Number(form.semestre),
          niveauId: form.niveauId,
          profId: form.profId || null,
          delegueId: form.delegueId || null,
        }),
      })

      if (res.ok) {
        const newCours = await res.json()
        if (form.syllabusContenu) {
          await fetch(`/api/cours/${newCours.id}/syllabus`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contenu: form.syllabusContenu,
              structure: structuredPreview,
              autoStructure: !structuredPreview, // Structurer automatiquement si pas fait manuellement
            }),
          })
        }
        setSuccess("Cours et syllabus configurés et structurés avec succès !")
        setOpen(false)
        setStructuredPreview(null)
        setForm({
          titre: "",
          description: "",
          heuresPrevues: 40,
          filiere: "",
          semestre: 1,
          niveauId: "",
          profId: "",
          delegueId: "",
          syllabusContenu: "",
        })
        loadData()
      } else {
        const d = await res.json()
        setError(d.error || "Erreur de création")
      }
    } catch (err) {
      setError("Erreur serveur")
    } finally {
      setSubmitting(false)
    }
  }

  const profs = users.filter((u) => u.role === "PROFESSEUR")
  const delegues = users.filter((u) => u.role === "DELEGUE")

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cours & Syllabi Structurés</h1>
          <p className="text-gray-500 mt-1">
            Créez vos cours et structurez automatiquement les syllabus par chapitres et grands titres avec l&apos;IA
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Créer un cours avec syllabus
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Nouveau cours et syllabus pédagogique structuré
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="space-y-2">
                <Label>Intitulé du cours</Label>
                <Input
                  placeholder="Ex: Algorithmique et Structures de Données"
                  value={form.titre}
                  onChange={(e) => setForm({ ...form, titre: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Filière</Label>
                  <Input
                    placeholder="Ex: Informatique, Droit, Gestion"
                    value={form.filiere}
                    onChange={(e) => setForm({ ...form, filiere: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Niveau académique</Label>
                  <Select value={form.niveauId} onValueChange={(v) => setForm({ ...form, niveauId: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir niveau" /></SelectTrigger>
                    <SelectContent>
                      {niveaux.map((n) => (
                        <SelectItem key={n.id} value={n.id}>{n.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {niveaux.length === 1 && (
                    <p className="text-[11px] text-purple-700 font-medium">
                      🔒 Niveau assigné automatiquement : {niveaux[0].nom}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Semestre (1 ou 2)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="6"
                    value={form.semestre}
                    onChange={(e) => setForm({ ...form, semestre: Number(e.target.value) })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Heures totales prévues</Label>
                  <Input
                    type="number"
                    min="5"
                    max="200"
                    value={form.heuresPrevues}
                    onChange={(e) => setForm({ ...form, heuresPrevues: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Professeur responsable</Label>
                  <Select value={form.profId} onValueChange={(v) => setForm({ ...form, profId: v })}>
                    <SelectTrigger><SelectValue placeholder="Assigner un prof" /></SelectTrigger>
                    <SelectContent>
                      {profs.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Délégué référent</Label>
                  <Select value={form.delegueId} onValueChange={(v) => setForm({ ...form, delegueId: v })}>
                    <SelectTrigger><SelectValue placeholder="Assigner un délégué" /></SelectTrigger>
                    <SelectContent>
                      {delegues.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CONTENU BRUT DU SYLLABUS + BOUTON STRUCTURATION IA */}
              <div className="space-y-2 pt-2 border-t">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <Label className="font-semibold text-gray-900">
                    Syllabus officiel du cours (Texte ou document)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                    onClick={handleStructureWithAI}
                    disabled={structuringAI || !form.syllabusContenu}
                  >
                    {structuringAI ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                    )}
                    Structurer avec l&apos;IA (Gemini)
                  </Button>
                </div>
                <Textarea
                  placeholder="Collez ici le programme ou syllabus (ex: Chapitre 1: Introduction aux réseaux, 1.1 Modèle OSI, 1.2 Protocoles TCP/IP... Chapitre 2: ...)"
                  rows={5}
                  value={form.syllabusContenu}
                  onChange={(e) => setForm({ ...form, syllabusContenu: e.target.value })}
                  required
                />
                <p className="text-[11px] text-gray-500">
                  L&apos;IA analysera ce texte pour générer automatiquement une hiérarchie de chapitres et grands titres avec heures estimées.
                </p>
              </div>

              {/* APERÇU DE LA STRUCTURATION IA SI DISPONIBLE */}
              {structuredPreview && (
                <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-blue-50/70 border border-indigo-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      Structure générée ({aiProvider})
                    </span>
                    <Badge variant="outline" className="bg-white text-indigo-700 text-[10px]">
                      {structuredPreview.chapitres?.length || 0} chapitres détectés
                    </Badge>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {structuredPreview.chapitres?.map((chap: any, idx: number) => (
                      <div key={chap.id || idx} className="p-2.5 bg-white rounded-lg border border-indigo-100 text-xs space-y-1">
                        <div className="flex justify-between items-center font-semibold text-gray-900">
                          <span>{chap.titre}</span>
                          <span className="text-indigo-600 font-mono text-[11px]">{chap.heuresEstimees || 6}h</span>
                        </div>
                        {chap.grandsTitres && chap.grandsTitres.length > 0 && (
                          <div className="pl-3 border-l-2 border-indigo-200 space-y-0.5 mt-1">
                            {chap.grandsTitres.map((gt: any, gIdx: number) => (
                              <p key={gt.id || gIdx} className="text-gray-600 text-[11px]">
                                • {gt.titre}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enregistrer le cours et le syllabus
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && <Alert variant="success"><AlertDescription>{success}</AlertDescription></Alert>}

      {/* LISTE DES COURS AVEC STATUT DU SYLLABUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : cours.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Aucun cours configuré. Cliquez sur &quot;Créer un cours avec syllabus&quot;.
          </div>
        ) : (
          cours.map((c) => {
            const hasStructure = Array.isArray(c.syllabus?.structure?.chapitres) && c.syllabus.structure.chapitres.length > 0
            const chapCount = hasStructure ? c.syllabus.structure.chapitres.length : 0

            return (
              <Card key={c.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline">{c.filiere} • S{c.semestre}</Badge>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold">
                        Code : {c.codeEtudiant}
                      </span>
                    </div>
                    <CardTitle className="text-lg mt-2">{c.titre}</CardTitle>
                    <CardDescription>{c.niveau?.nom} • {c.heuresPrevues}h prévues</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-2.5 text-xs text-gray-600">
                    <p><strong>Professeur :</strong> {c.prof?.name || "Non assigné"}</p>
                    <p><strong>Délégué :</strong> {c.delegue?.name || "Non assigné"}</p>

                    <div className="pt-2 border-t flex items-center justify-between">
                      <span className="text-gray-500 font-medium">Syllabus officiel :</span>
                      {hasStructure ? (
                        <Badge variant="success" className="flex items-center gap-1 bg-green-100 text-green-800 border-green-200">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          {chapCount} chapitres structurés
                        </Badge>
                      ) : c.syllabus ? (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          Texte brut
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Non renseigné</Badge>
                      )}
                    </div>
                  </CardContent>
                </div>

                {/* Actions syllabus */}
                <div className="p-4 pt-0 border-t mt-2 flex flex-col gap-2">
                  {hasStructure ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs text-indigo-700 hover:bg-indigo-50 border-indigo-200"
                      onClick={() => setViewingSyllabusCours(c)}
                    >
                      <Layers className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                      Voir le syllabus structuré ({chapCount})
                    </Button>
                  ) : c.syllabus ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200"
                      onClick={() => handleStructureExistingCours(c)}
                      disabled={structuringCoursId === c.id}
                    >
                      {structuringCoursId === c.id ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
                      )}
                      Structurer avec l&apos;IA
                    </Button>
                  ) : null}
                </div>
              </Card>
            )
          })
        )}
      </div>

      {/* DIALOG DE CONSULTATION D'UN SYLLABUS STRUCTURÉ */}
      {viewingSyllabusCours && (
        <Dialog open={!!viewingSyllabusCours} onOpenChange={() => setViewingSyllabusCours(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Syllabus officiel structuré : {viewingSyllabusCours.titre}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-2">
              <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-700 flex justify-between items-center">
                <span>{viewingSyllabusCours.filiere} • S{viewingSyllabusCours.semestre}</span>
                <span className="font-semibold text-indigo-700">
                  {viewingSyllabusCours.heuresPrevues}h prévues au programme
                </span>
              </div>

              <div className="space-y-3">
                {viewingSyllabusCours.syllabus?.structure?.chapitres?.map((chap: any, idx: number) => (
                  <div key={chap.id || idx} className="p-3 border rounded-xl bg-white shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 flex items-center justify-center text-xs font-bold">
                          {chap.numero || idx + 1}
                        </span>
                        {chap.titre}
                      </h4>
                      <Badge variant="outline" className="font-mono text-xs">
                        {chap.heuresEstimees || 6}h
                      </Badge>
                    </div>

                    {chap.description && (
                      <p className="text-xs text-gray-500 pl-8">{chap.description}</p>
                    )}

                    {chap.grandsTitres && chap.grandsTitres.length > 0 && (
                      <div className="pl-8 pt-1 space-y-1">
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Grands Titres / Points d&apos;arrêt :
                        </p>
                        {chap.grandsTitres.map((gt: any, gIdx: number) => (
                          <div key={gt.id || gIdx} className="flex items-start gap-2 text-xs text-gray-700">
                            <ChevronRight className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                            <span>{gt.titre}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
