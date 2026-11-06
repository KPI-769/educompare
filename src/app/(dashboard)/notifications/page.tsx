import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Bell, Clock, Info } from "lucide-react"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const userEmail = session.user?.email || ""
  const role = (session.user as any)?.role

  const notifications = await prisma.notification.findMany({
    where: {
      OR: [
        { destinataire: userEmail },
        { destinataire: role },
        { destinataire: "ALL" },
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  })

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Notifications & Alertes</h1>
        <p className="text-gray-500 mt-1">Alertes de retards, validations et partages de rapports</p>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              <Bell className="w-10 h-10 mx-auto text-gray-300 mb-2" />
              Aucune notification pour le moment.
            </CardContent>
          </Card>
        ) : (
          notifications.map((n) => (
            <Card key={n.id} className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4 pb-4 flex items-start gap-3">
                <div className="p-2 rounded-full bg-blue-50 text-blue-600 flex-shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="text-sm font-semibold text-gray-900">{n.titre}</h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {new Date(n.createdAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">{n.message}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

