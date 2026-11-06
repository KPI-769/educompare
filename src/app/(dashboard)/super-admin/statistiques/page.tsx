"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Loader2 } from "lucide-react"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

export default function SuperAdminStatistiquesPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/cours")
      .then((r) => r.json())
      .then((coursList) => {
        const mapped = coursList.map((c: any) => {
          const validated = (c.progressions || []).filter((p: any) => p.validation?.status === "VALIDATED")
          const hValidees = validated.reduce((acc: number, p: any) => acc + (p.heuresEffectives || 0), 0)
          const pct = Math.min(100, Math.round((hValidees / (c.heuresPrevues || 1)) * 100))

          return {
            name: c.titre.length > 15 ? c.titre.substring(0, 15) + "..." : c.titre,
            filiere: c.filiere,
            semestre: `S${c.semestre}`,
            prevues: c.heuresPrevues,
            validees: hValidees,
            taux: pct,
          }
        })
        setData(mapped)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Suivi Statistique & Analyse Globale</h1>
        <p className="text-gray-500 mt-1">
          Visualisation interactive de la progression par semestre et taux d&apos;achèvement du programme
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Heures Prévues vs Heures Validées</CardTitle>
                <CardDescription>Comparaison des volumes horaires par enseignement</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={12} unit="h" />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="prevues" fill="#94a3b8" name="Prévues (h)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="validees" fill="#3b82f6" name="Validées (h)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Taux d&apos;accomplissement (%)</CardTitle>
                <CardDescription>Pourcentage réalisé par matière</CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, 100]} unit="%" fontSize={12} />
                    <YAxis dataKey="name" type="category" fontSize={11} width={90} />
                    <Tooltip />
                    <Bar dataKey="taux" fill="#10b981" name="Taux d'avancement (%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Indicateurs de Performance Pédagogique par Semestre</CardTitle>
              <CardDescription>Synthèse de couverture des programmes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <span className="text-xs text-blue-700 font-semibold uppercase">Total Matières</span>
                  <p className="text-2xl font-bold text-blue-900 mt-1">{data.length}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <span className="text-xs text-green-700 font-semibold uppercase">En Avance / Conforme</span>
                  <p className="text-2xl font-bold text-green-900 mt-1">
                    {data.filter((d) => d.taux >= 50).length}
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <span className="text-xs text-amber-700 font-semibold uppercase">À Surveiller</span>
                  <p className="text-2xl font-bold text-amber-900 mt-1">
                    {data.filter((d) => d.taux < 50 && d.taux >= 25).length}
                  </p>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <span className="text-xs text-red-700 font-semibold uppercase">Retard Critique</span>
                  <p className="text-2xl font-bold text-red-900 mt-1">
                    {data.filter((d) => d.taux < 25).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

