import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, BarChart3, Users, Bell, FileText, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-blue-900">EduCompare</span>
          </div>
          <div className="flex gap-2">
            <Link href="/etudiant/acces">
              <Button variant="outline" size="sm">Accès Étudiant</Button>
            </Link>
            <Link href="/login">
              <Button size="sm">Connexion</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 md:py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
          Plateforme d&apos;Analyse Intelligente
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
          Suivi pédagogique
          <br />
          <span className="text-blue-600">en temps réel</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          EduCompare permet aux établissements de comparer et analyser leurs performances
          pédagogiques grâce à des outils de visualisation avancés et des alertes automatiques.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              Commencer maintenant
            </Button>
          </Link>
          <Link href="/etudiant/acces">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Consulter ma progression
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Tout ce dont vous avez besoin
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: BarChart3, title: "Tableaux de bord", desc: "Visualisez la progression en temps réel avec des graphiques interactifs par semestre", color: "text-blue-500" },
            { icon: Bell, title: "Alertes automatiques", desc: "Notifications instantanées pour les étudiants et alertes email pour les professeurs en retard", color: "text-orange-500" },
            { icon: FileText, title: "Rapports PDF", desc: "Génération et partage automatique de rapports hebdomadaires avec l'administration", color: "text-green-500" },
            { icon: Shield, title: "Analyse IA", desc: "Vérification automatique de la conformité des cours au syllabus avec un score ≥ 70%", color: "text-purple-500" },
            { icon: Users, title: "Multi-rôles", desc: "Interface dédiée pour chaque acteur : super admin, responsable, délégué, prof, étudiant", color: "text-indigo-500" },
            { icon: BookOpen, title: "Suivi syllabi", desc: "Gestion complète des cours, syllabus et progression par filière et par niveau", color: "text-red-500" },
          ].map((f, i) => (
            <Card key={i} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <f.icon className={`w-8 h-8 ${f.color} mb-2`} />
                <CardTitle className="text-lg">{f.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{f.desc}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-gray-500 text-sm">
          © 2026 EduCompare — Plateforme d&apos;Analyse Pédagogique Intelligente
        </div>
      </footer>
    </div>
  )
}

