"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function EtudiantAccesPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch(`/api/etudiant/cours?code=${encodeURIComponent(code.trim().toUpperCase())}`)
      if (res.ok) {
        router.push(`/etudiant/cours/${code.trim().toUpperCase()}`)
      } else {
        setError("Code invalide. Vérifiez le code fourni par votre délégué.")
      }
    } catch (err) {
      setError("Erreur de connexion au serveur.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-blue-900">EduCompare</span>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Accès Étudiant</CardTitle>
            <CardDescription>Entrez le code de votre cours pour suivre la progression en temps réel</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="code">Code du cours</Label>
                <Input
                  id="code"
                  placeholder="Ex: MATH101"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="text-center text-lg font-mono tracking-widest uppercase"
                  required
                />
                <p className="text-xs text-muted-foreground text-center">
                  Ce code vous a été communiqué par votre responsable ou délégué
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Consulter ma progression
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Link href="/login" className="text-sm text-blue-600 hover:underline">
                Connexion avec un compte personnel →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
