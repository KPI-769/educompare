import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, BookOpen, GraduationCap, Bell, BarChart3, TrendingUp } from "lucide-react"

export default async function SuperAdminDashboard() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "SUPER_ADMIN") redirect("/login")

  const [userCount, coursCount, niveauCount, notifCount] = await Promise.all([
    prisma.user.count(),
    prisma.cours.count(),
    prisma.niveau.count(),
    prisma.notification.count({ where: { lu: false } }),
  ])

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { name: true, email: true, role: true, createdAt: true },
  })

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "destructive",
    RESPONSABLE: "default",
    DELEGUE: "secondary",
    PROFESSEUR: "success",
    ETUDIANT: "warning",
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-muted-foreground">Vue d&apos;ensemble de la plateforme EduCompare</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Utilisateurs", value: userCount, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Cours", value: coursCount, icon: BookOpen, color: "text-green-600", bg: "bg-green-50" },
          { title: "Niveaux", value: niveauCount, icon: GraduationCap, color: "text-purple-600", bg: "bg-purple-50" },
          { title: "Notifications non lues", value: notifCount, icon: Bell, color: "text-orange-600", bg: "bg-orange-50" },
        ].map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs récents</CardTitle>
          <CardDescription>Les 5 derniers comptes créés</CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucun utilisateur pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {recentUsers.map((user, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={(roleColors[user.role] as any) || "outline"} className="text-xs">
                      {user.role}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString("fr-FR")}
                    </span>
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

