"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Clock, MessageSquare, Loader2 } from "lucide-react"

export default function ProfesseurValidationsPage() {
  const [progressions, setProgressions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [commentaires, setCommentaires] = useState<Record<string, string>>({})
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [msg, setMsg] = useState("")

  const fetchProgressions = async () => {
    try {
      const res = await fetch("/api/progressions")
      if (res.ok) {
        const data = await res.json()
        setProgressions(data)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProgressions()
  }, [])

  const handleValidation = async (progressionId: string, status: "VALIDATED" | "REFUSED") => {
    setActionLoading(progressionId)
    setMsg("")

    try {
      const res = await fetch("/api/validations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progressionId,
          status,
          commentaire: commentaires[progressionId] || "",
        }),
      })

      if (res.ok) {
        setMsg(`Séance ${status === "VALIDATED" ? "validée" : "refusée"} avec succès.`)
        fetchProgressions()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Validations des séances</h1>
        <p className="text-gray-500 mt-1">
          Confirmez ou refusez ce que le délégué a renseigné concernant le déroulé de vos cours
        </p>
      </div>

      {msg && <Alert variant="success"><AlertDescription>{msg}</AlertDescription></Alert>}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : progressions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            Aucune déclaration de séance pour l&apos;instant.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {progressions.map((p) => {
            const isPending = !p.validation || p.validation.status === "PENDING"
            return (
              <Card key={p.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50/50 pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-lg">{p.cours?.titre}</CardTitle>
                      <CardDescription>
                        Délégué : {p.delegue?.name} • Semaine {p.semaine} • {p.heuresEffectives}h déclarées
                      </CardDescription>
                    </div>
                    <Badge variant={p.validation?.status === "VALIDATED" ? "success" : p.validation?.status === "REFUSED" ? "destructive" : "warning"}>
                      {p.validation?.status === "VALIDATED" ? "Validé" : p.validation?.status === "REFUSED" ? "Refusé" : "En attente de votre accord"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-4 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                      Point d&apos;arrêt renseigné par le délégué :
                    </h4>
                    <p className="text-sm bg-gray-50 p-3 rounded-md border text-gray-800">
                      {p.partieAtteinte}
                    </p>
                  </div>

                  <div className="text-xs text-gray-500 flex flex-wrap gap-4">
                    <span>Début : {new Date(p.heureDebut).toLocaleString()}</span>
                    <span>Fin : {new Date(p.heureFin).toLocaleString()}</span>
                  </div>

                  {isPending ? (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" /> Commentaire ou motif d&apos;ajustement (facultatif)
                        </label>
                        <Textarea
                          placeholder="Ex: Nous avons également traité la fiche TD n°2..."
                          rows={2}
                          value={commentaires[p.id] || ""}
                          onChange={(e) => setCommentaires({ ...commentaires, [p.id]: e.target.value })}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          variant="default"
                          className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                          disabled={actionLoading === p.id}
                          onClick={() => handleValidation(p.id, "VALIDATED")}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Confirmer la progression
                        </Button>
                        <Button
                          variant="destructive"
                          className="w-full sm:w-auto"
                          disabled={actionLoading === p.id}
                          onClick={() => handleValidation(p.id, "REFUSED")}
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Refuser
                        </Button>
                      </div>
                    </div>
                  ) : (
                    p.validation?.commentaire && (
                      <div className="text-xs p-2.5 rounded bg-gray-100 text-gray-700">
                        <strong>Votre commentaire :</strong> {p.validation.commentaire}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

