import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardSidebar } from "@/components/dashboard/sidebar"

export default async function ProfesseurLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "PROFESSEUR") {
    redirect("/login")
  }

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 overflow-hidden">
      <DashboardSidebar
        role="PROFESSEUR"
        userName={(session.user as any)?.name || "Professeur"}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
