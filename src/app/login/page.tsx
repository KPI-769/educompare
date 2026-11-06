"use client"
import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookOpen, Loader2 } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const cleanEmail = email.trim().toLowerCase()
      const result = await signIn("credentials", {
        email: cleanEmail,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Email ou mot de passe incorrect")
        setLoading(false)
        return
      }

      // Récupérer la session pour rediriger vers le dashboard approprié
      const res = await fetch("/api/auth/session")
      const session = await res.json()
      const role = session?.user?.role

      const redirectMap: Record<string, string> = {
        SUPER_ADMIN: "/super-admin/dashboard",
        RESPONSABLE: "/responsable/dashboard",
        DELEGUE: "/delegue/dashboard",
        PROFESSEUR: "/professeur/dashboard",
        ETUDIANT: "/etudiant/dashboard",
      }

      router.push(redirectMap[role] || "/")
      router.refresh()
    } catch (err) {
      setError("Une erreur est survenue lors de la connexion")
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
            <CardTitle>Connexion</CardTitle>
            <CardDescription>Accédez à votre espace pédagogique et administratif</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Adresse Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="nom@etablissement.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Se connecter
              </Button>
            </form>
            <div className="mt-5 pt-4 border-t text-center space-y-2">
              <Link href="/etudiant/acces" className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline block">
                Étudiant ? Consulter un cours sans compte →
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
