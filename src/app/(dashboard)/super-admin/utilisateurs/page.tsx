"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users, PlusCircle, Loader2, Pencil, Trash2, Shield,
  GraduationCap, UserCheck, KeyRound, BookOpen, Search,
} from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  RESPONSABLE: "Responsable",
  PROFESSEUR: "Professeur",
  DELEGUE: "Délégué",
  ETUDIANT: "Étudiant",
}

const ROLE_VARIANTS: Record<string, any> = {
  SUPER_ADMIN: "destructive",
  RESPONSABLE: "default",
  PROFESSEUR: "secondary",
  DELEGUE: "outline",
  ETUDIANT: "outline",
}

function emptyForm(role = "RESPONSABLE") {
  return { name: "", email: "", password: "", role, niveauId: "" }
}

function emptyEditForm() {
  return { name: "", email: "", password: "", role: "", niveauId: "" }
}

export default function SuperAdminUtilisateursPage() {
  const [users, setUsers] = useState<any[]>([])
  const [niveaux, setNiveaux] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Create
  const [openCreate, setOpenCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [form, setForm] = useState(emptyForm())

  // Edit
  const [editingUser, setEditingUser] = useState<any | null>(null)
  const [editForm, setEditForm] = useState(emptyEditForm())
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editError, setEditError] = useState("")

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<any | null>(null)

  const loadData = async () => {
    try {
      const [resU, resN] = await Promise.all([fetch("/api/users"), fetch("/api/niveaux")])
      if (resU.ok) setUsers(await resU.json())
      if (resN.ok) setNiveaux(await resN.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData() }, [])

  /* ─── CREATE ─── */
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setSuccess(`Compte ${ROLE_LABELS[form.role]} créé avec succès !`)
        setOpenCreate(false)
        setForm(emptyForm())
        loadData()
      } else {
        const d = await res.json()
        setError(d.error || "Erreur de création")
      }
    } catch { setError("Erreur serveur") }
    finally { setSubmitting(false) }
  }

  /* ─── OPEN EDIT ─── */
  const openEdit = (u: any) => {
    setEditingUser(u)
    setEditForm({ name: u.name, email: u.email, password: "", role: u.role, niveauId: u.niveauId || "" })
    setEditError("")
  }

  /* ─── SAVE EDIT ─── */
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setEditSubmitting(true)
    setEditError("")
    try {
      const payload: any = {
        name: editForm.name,
        email: editForm.email,
        role: editForm.role,
        niveauId: editForm.niveauId || null,
      }
      if (editForm.password.trim()) payload.password = editForm.password

      const res = await fetch(`/api/users/${editingUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSuccess("Utilisateur mis à jour avec succès !")
        setEditingUser(null)
        loadData()
      } else {
        const d = await res.json()
        setEditError(d.error || "Erreur de mise à jour")
      }
    } catch { setEditError("Erreur serveur") }
    finally { setEditSubmitting(false) }
  }

  /* ─── DELETE ─── */
  const handleDelete = async (u: any) => {
    setDeletingId(u.id)
    try {
      const res = await fetch(`/api/users/${u.id}`, { method: "DELETE" })
      if (res.ok) {
        setSuccess(`Compte de ${u.name} supprimé.`)
        setConfirmDelete(null)
        loadData()
      } else {
        const d = await res.json()
        setSuccess("")
        setError(d.error || "Erreur de suppression")
      }
    } catch { setError("Erreur serveur") }
    finally { setDeletingId(null) }
  }

  /* ─── FILTER ─── */
  const filtered = (roleFilter?: string) =>
    users
      .filter((u) => !roleFilter || u.role === roleFilter)
      .filter((u) =>
        !search ||
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )

  const tabCounts = {
    tous: users.length,
    responsables: users.filter((u) => u.role === "RESPONSABLE").length,
    professeurs: users.filter((u) => u.role === "PROFESSEUR").length,
    delegues: users.filter((u) => u.role === "DELEGUE").length,
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-500 mt-1">
            Créez, modifiez et supprimez tous les comptes de la plateforme
          </p>
        </div>

        <Dialog open={openCreate} onOpenChange={setOpenCreate}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="w-4 h-4 mr-2" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600" />
                Créer un compte utilisateur
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

              <div className="space-y-2">
                <Label>Rôle</Label>
                <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RESPONSABLE">Responsable de filière</SelectItem>
                    <SelectItem value="PROFESSEUR">Professeur / Enseignant</SelectItem>
                    <SelectItem value="DELEGUE">Délégué de promotion</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nom complet</Label>
                <Input
                  placeholder="Ex: Dr. Martin Dupont"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  placeholder="email@etablissement.edu"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              {["RESPONSABLE", "PROFESSEUR", "DELEGUE"].includes(form.role) && (
                <div className="space-y-2">
                  <Label>Niveau assigné</Label>
                  <Select value={form.niveauId} onValueChange={(v) => setForm({ ...form, niveauId: v })}>
                    <SelectTrigger><SelectValue placeholder="Choisir un niveau" /></SelectTrigger>
                    <SelectContent>
                      {niveaux.map((n) => (
                        <SelectItem key={n.id} value={n.id}>{n.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Créer l&apos;utilisateur
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {success && (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* Barre de recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Rechercher par nom ou email..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tabs par rôle */}
      <Tabs defaultValue="tous">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="tous" className="text-xs">
            Tous ({tabCounts.tous})
          </TabsTrigger>
          <TabsTrigger value="responsables" className="text-xs">
            <UserCheck className="w-3.5 h-3.5 mr-1" /> Responsables ({tabCounts.responsables})
          </TabsTrigger>
          <TabsTrigger value="professeurs" className="text-xs">
            <GraduationCap className="w-3.5 h-3.5 mr-1" /> Professeurs ({tabCounts.professeurs})
          </TabsTrigger>
          <TabsTrigger value="delegues" className="text-xs">
            <BookOpen className="w-3.5 h-3.5 mr-1" /> Délégués ({tabCounts.delegues})
          </TabsTrigger>
        </TabsList>

        {[
          { value: "tous", roleFilter: undefined },
          { value: "responsables", roleFilter: "RESPONSABLE" },
          { value: "professeurs", roleFilter: "PROFESSEUR" },
          { value: "delegues", roleFilter: "DELEGUE" },
        ].map(({ value, roleFilter }) => (
          <TabsContent key={value} value={value}>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
            ) : filtered(roleFilter).length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                Aucun utilisateur dans cette catégorie
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {filtered(roleFilter).map((u) => (
                  <UserCard
                    key={u.id}
                    user={u}
                    niveaux={niveaux}
                    onEdit={openEdit}
                    onDelete={(u) => setConfirmDelete(u)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Dialog MODIFIER */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-4 h-4 text-indigo-600" />
              Modifier : {editingUser?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-2">
            {editError && <Alert variant="destructive"><AlertDescription>{editError}</AlertDescription></Alert>}

            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={editForm.role} onValueChange={(v) => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RESPONSABLE">Responsable de filière</SelectItem>
                  <SelectItem value="PROFESSEUR">Professeur / Enseignant</SelectItem>
                  <SelectItem value="DELEGUE">Délégué de promotion</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Niveau assigné</Label>
              <Select value={editForm.niveauId || ""} onValueChange={(v) => setEditForm({ ...editForm, niveauId: v })}>
                <SelectTrigger><SelectValue placeholder="Aucun" /></SelectTrigger>
                <SelectContent>
                  {niveaux.map((n) => (
                    <SelectItem key={n.id} value={n.id}>{n.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-gray-500" />
                Nouveau mot de passe
                <span className="text-xs text-gray-400 font-normal">(laisser vide pour ne pas changer)</span>
              </Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setEditingUser(null)}
              >
                Annuler
              </Button>
              <Button type="submit" className="flex-1" disabled={editSubmitting}>
                {editSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enregistrer
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog CONFIRMER SUPPRESSION */}
      <Dialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-4 h-4" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-2">
            <p className="text-sm text-gray-700">
              Êtes-vous sûr de vouloir supprimer le compte de{" "}
              <strong>{confirmDelete?.name}</strong> ({confirmDelete?.email}) ?
            </p>
            <p className="text-xs text-gray-400">
              Cette action est irréversible. Les cours et progressions associés seront conservés.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(null)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              disabled={deletingId === confirmDelete?.id}
              onClick={() => handleDelete(confirmDelete)}
            >
              {deletingId === confirmDelete?.id && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/* ───── Carte Utilisateur ───── */
function UserCard({
  user,
  niveaux,
  onEdit,
  onDelete,
}: {
  user: any
  niveaux: any[]
  onEdit: (u: any) => void
  onDelete: (u: any) => void
}) {
  const roleIcon: Record<string, React.ReactNode> = {
    SUPER_ADMIN: <Shield className="w-4 h-4 text-red-500" />,
    RESPONSABLE: <UserCheck className="w-4 h-4 text-blue-600" />,
    PROFESSEUR: <GraduationCap className="w-4 h-4 text-green-600" />,
    DELEGUE: <BookOpen className="w-4 h-4 text-purple-600" />,
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-shrink-0">{roleIcon[user.role] || <Users className="w-4 h-4 text-gray-500" />}</div>
            <div className="min-w-0">
              <CardTitle className="text-sm font-bold truncate">{user.name}</CardTitle>
              <CardDescription className="text-xs truncate">{user.email}</CardDescription>
            </div>
          </div>
          <Badge variant={ROLE_VARIANTS[user.role] || "secondary"} className="text-[10px] flex-shrink-0">
            {ROLE_LABELS[user.role] || user.role}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 text-xs text-gray-500">
        {user.niveau && (
          <p className="flex items-center gap-1.5">
            <span className="text-gray-400">Niveau :</span>
            <strong className="text-gray-700">{user.niveau.nom}</strong>
          </p>
        )}
        <p className="text-gray-400">
          Créé le {new Date(user.createdAt).toLocaleDateString("fr-FR")}
        </p>

        {/* Actions CRUD */}
        {user.role !== "SUPER_ADMIN" && (
          <div className="flex gap-2 pt-1 border-t">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-xs h-7 text-indigo-700 border-indigo-200 hover:bg-indigo-50"
              onClick={() => onEdit(user)}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Modifier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7 text-red-600 border-red-200 hover:bg-red-50"
              onClick={() => onDelete(user)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
