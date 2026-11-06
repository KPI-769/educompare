"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { GraduationCap, PlusCircle, Trash2, Loader2, BookOpen } from "lucide-react"

export default function SuperAdminNiveauxPage() {
  const [niveaux, setNiveaux] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({ nom: "", description: "" })

  const loadData = async () => {
    try {
      const res = await fetch("/api/niveaux")
      if (res.ok) setNiveaux(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/niveaux", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setSuccess("Niveau d'étude créé avec succès !")
        setOpen(false)
        setForm({ nom: "", description: "" })
        loadData()
      } else {
        const d = await res.json()
        setError(d.error || "Erreur lors de la création")
      }
    } catch (err) {
      setError("Erreur serveur")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Niveaux d&apos;Étude</h1>
          <p className="text-gray-500 mt-1">Créez et organisez les niveaux universitaires (Licence 1, Master 2...)</p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Nouveau Niveau
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un niveau académique</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="space-y-2">
                <Label>Nom du niveau</Label>
                <Input
                  placeholder="Ex: Licence 1, Licence 2, Master 1, Master 2..."
                  value={form.nom}
                  onChange={(e) => setForm({ ...form, nom: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Description / Spécificités</Label>
                <Input
                  placeholder="Ex: Première année commune aux sciences"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Créer le niveau
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && <Alert variant="success"><AlertDescription>{success}</AlertDescription></Alert>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : niveaux.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            Aucun niveau créé pour l&apos;instant.
          </div>
        ) : (
          niveaux.map((n) => (
            <Card key={n.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-600" />
                  <CardTitle className="text-lg">{n.nom}</CardTitle>
                </div>
                <CardDescription>{n.description || "Aucune description"}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2">
                <Badge variant="secondary">{n.cours?.length || 0} cours rattachés</Badge>
                <Badge variant="outline">{n.users?.length || 0} utilisateurs</Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

