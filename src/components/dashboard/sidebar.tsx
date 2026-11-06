"use client"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  BookOpen,
  LayoutDashboard,
  Users,
  GraduationCap,
  FileText,
  Bell,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  BarChart3,
  CheckSquare,
  Upload,
  ClipboardList,
} from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export interface NavItemConfig {
  label: string
  href: string
  iconName: string
}

interface SidebarProps {
  role: string
  userName: string
  navItems?: NavItemConfig[]
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  BarChart3,
  Bell,
  Settings,
  CheckSquare,
  Upload,
  ClipboardList,
}

const defaultRoleNav: Record<string, NavItemConfig[]> = {
  SUPER_ADMIN: [
    { label: "Tableau de bord", href: "/super-admin/dashboard", iconName: "LayoutDashboard" },
    { label: "Utilisateurs", href: "/super-admin/utilisateurs", iconName: "Users" },
    { label: "Niveaux", href: "/super-admin/niveaux", iconName: "GraduationCap" },
    { label: "Statistiques", href: "/super-admin/statistiques", iconName: "BarChart3" },
    { label: "Notifications", href: "/super-admin/notifications", iconName: "Bell" },
  ],
  RESPONSABLE: [
    { label: "Tableau de bord", href: "/responsable/dashboard", iconName: "LayoutDashboard" },
    { label: "Cours & Syllabus", href: "/responsable/cours", iconName: "BookOpen" },
    { label: "Progression & Alertes", href: "/responsable/progressions", iconName: "BarChart3" },
    { label: "Délégués & Codes", href: "/responsable/delegues", iconName: "Users" },
    { label: "Rapports Hebdo", href: "/responsable/rapports", iconName: "FileText" },
    { label: "Notifications", href: "/responsable/notifications", iconName: "Bell" },
  ],
  PROFESSEUR: [
    { label: "Tableau de bord", href: "/professeur/dashboard", iconName: "LayoutDashboard" },
    { label: "Mes cours", href: "/professeur/cours", iconName: "BookOpen" },
    { label: "Validations", href: "/professeur/validations", iconName: "CheckSquare" },
    { label: "Upload & Analyse IA", href: "/professeur/uploads", iconName: "Upload" },
    { label: "Notifications", href: "/professeur/notifications", iconName: "Bell" },
  ],
  DELEGUE: [
    { label: "Tableau de bord", href: "/delegue/dashboard", iconName: "LayoutDashboard" },
    { label: "Mes cours", href: "/delegue/cours", iconName: "BookOpen" },
    { label: "Renseigner séance", href: "/delegue/progressions", iconName: "ClipboardList" },
    { label: "Notifications", href: "/delegue/notifications", iconName: "Bell" },
  ],
}

export function DashboardSidebar({ role, userName, navItems }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const items = navItems || defaultRoleNav[role] || []

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Admin",
    RESPONSABLE: "Responsable",
    DELEGUE: "Délégué",
    PROFESSEUR: "Professeur",
    ETUDIANT: "Étudiant",
  }

  const roleColors: Record<string, string> = {
    SUPER_ADMIN: "bg-red-600",
    RESPONSABLE: "bg-purple-600",
    DELEGUE: "bg-blue-600",
    PROFESSEUR: "bg-green-600",
    ETUDIANT: "bg-orange-600",
  }

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full bg-white border-r">
      {/* Logo & Close/Collapse */}
      <div className={cn("flex items-center justify-between p-4 border-b", collapsed && !isMobile && "justify-center p-2")}>
        <div className="flex items-center gap-2 overflow-hidden">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white shadow-sm", roleColors[role] || "bg-blue-600")}>
            <BookOpen className="w-4 h-4" />
          </div>
          {(!collapsed || isMobile) && <span className="font-bold text-blue-900 text-lg tracking-tight">EduCompare</span>}
        </div>
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            className="h-8 w-8 text-gray-500 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn("hidden md:flex h-7 w-7 text-gray-400 hover:text-gray-700", collapsed && "hidden")}
            title="Réduire"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Role badge */}
      {(!collapsed || isMobile) && (
        <div className="px-4 py-3 border-b bg-gray-50/80">
          <p className="text-xs text-muted-foreground">Connecté en tant que</p>
          <p className="text-sm font-semibold truncate text-gray-900">{userName}</p>
          <span className="inline-block text-xs text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded mt-0.5">
            {roleLabels[role] || role}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const IconComponent = iconMap[item.iconName] || BookOpen
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

          return (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start gap-2 text-sm font-medium transition-colors",
                  isActive && "bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100",
                  collapsed && !isMobile && "justify-center px-2"
                )}
                size="sm"
                title={collapsed && !isMobile ? item.label : undefined}
              >
                <IconComponent className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-blue-600" : "text-gray-500")} />
                {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* Toggle for collapsed mode on desktop */}
      {!isMobile && collapsed && (
        <div className="p-2 border-t flex justify-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(false)}
            className="h-8 w-8 text-gray-500"
            title="Agrandir"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="p-2 border-t space-y-1 bg-white">
        <Button
          variant="ghost"
          className={cn("w-full justify-start gap-2 text-red-600 hover:text-red-700 hover:bg-red-50", collapsed && !isMobile && "justify-center px-2")}
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {(!collapsed || isMobile) && <span>Déconnexion</span>}
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-white border-b shadow-xs flex-shrink-0 z-30 sticky top-0">
        <div className="flex items-center gap-2.5">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(true)}
            className="h-9 w-9 text-gray-700 hover:bg-gray-100"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-xs", roleColors[role] || "bg-blue-600")}>
              <BookOpen className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-blue-900 text-base">EduCompare</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-700 max-w-[120px] truncate hidden sm:inline">
            {userName}
          </span>
          <span className="text-[11px] font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
            {roleLabels[role] || role}
          </span>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white transition-transform duration-200 ease-in-out md:hidden shadow-2xl",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent isMobile />
      </div>

      {/* Desktop Sidebar */}
      <aside className={cn("hidden md:flex flex-col flex-shrink-0 h-full transition-all duration-200", collapsed ? "w-16" : "w-64")}>
        <SidebarContent />
      </aside>
    </>
  )
}
