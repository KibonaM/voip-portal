"use client"

import { useState } from "react"
import { TopNavbar } from "./top-navbar"
import { AdminDashboard } from "./admin-dashboard"
import { UserDashboard } from "./user-dashboard"
import { UserManagement } from "./user-management"
import { ExtensionManagement } from "./extension-management"
import { LiveDirectory } from "./live-directory"
import { CallRecords } from "./call-records"
import { MonitoringPage } from "./monitoring-page"
import { ReportsPage } from "./reports-page"
import { SecurityPage } from "./security-page"
import { AuditLogs } from "./audit-logs"
import { SettingsPage } from "./settings-page"
import { VoicemailPage } from "./voicemail-page"
import { useAuth } from "@/lib/auth-context"
import { MyCallsPage } from "./my-calls-page"
import { ChangePasswordPage } from "./change-password-page"

// Simple client-side routing since all pages are in one SPA
import { createContext, useContext } from "react"

interface RouterContextType {
  currentPage: string
  navigate: (page: string) => void
}

const RouterContext = createContext<RouterContextType>({
  currentPage: "/dashboard",
  navigate: () => {},
})

export function useRouter() {
  return useContext(RouterContext)
}

export function PortalRouter() {
  const [currentPage, setCurrentPage] = useState("/dashboard")
  const { user } = useAuth()

  const navigate = (page: string) => setCurrentPage(page)

  const renderPage = () => {
    // Force password change if required
    if (user?.mustChangePassword) {
      return <ChangePasswordPage onComplete={() => window.location.reload()} />
    }

    if (user?.role === "admin") {
      switch (currentPage) {
        case "/dashboard": return <AdminDashboard />
        case "/dashboard/users": return <UserManagement />
        case "/dashboard/extensions": return <ExtensionManagement />
        case "/dashboard/directory": return <LiveDirectory />
        case "/dashboard/call-records": return <CallRecords />
        case "/dashboard/monitoring": return <MonitoringPage />
        case "/dashboard/reports": return <ReportsPage />
        case "/dashboard/security": return <SecurityPage />
        case "/dashboard/audit-logs": return <AuditLogs />
        case "/dashboard/settings": return <SettingsPage />
        default: return <AdminDashboard />
      }
    } else {
      switch (currentPage) {
        case "/dashboard": return <UserDashboard />
        case "/dashboard/directory": return <LiveDirectory />
        case "/dashboard/my-calls": return <MyCallsPage />
        case "/dashboard/voicemail": return <VoicemailPage />
        case "/dashboard/settings": return <SettingsPage />
        default: return <UserDashboard />
      }
    }
  }

  return (
    <RouterContext.Provider value={{ currentPage, navigate }}>
      <div className="flex min-h-screen flex-col">
        <TopNavbar />
        <div className="flex flex-1">
          <SidebarNavWrapped currentPage={currentPage} navigate={navigate} />
          <main className="flex-1 overflow-auto p-6">
            {renderPage()}
          </main>
        </div>
      </div>
    </RouterContext.Provider>
  )
}

function SidebarNavWrapped({ currentPage, navigate }: { currentPage: string; navigate: (page: string) => void }) {
  return <SidebarNavClient currentPage={currentPage} navigate={navigate} />
}

import {
  LayoutDashboard,
  Users,
  Phone,
  BookOpen,
  PhoneCall,
  Activity,
  BarChart3,
  ShieldAlert,
  FileText,
  Settings,
  Voicemail,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const adminLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/users", label: "Users", icon: Users },
  { href: "/dashboard/extensions", label: "Extensions", icon: Phone },
  { href: "/dashboard/directory", label: "Live Directory", icon: BookOpen },
  { href: "/dashboard/call-records", label: "Call Records", icon: PhoneCall },
  { href: "/dashboard/monitoring", label: "Monitoring", icon: Activity },
  { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
  { href: "/dashboard/security", label: "Security", icon: ShieldAlert },
  { href: "/dashboard/audit-logs", label: "Audit Logs", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

const userLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/directory", label: "Directory", icon: BookOpen },
  { href: "/dashboard/my-calls", label: "My Calls", icon: PhoneCall },
  { href: "/dashboard/voicemail", label: "Voicemail", icon: Voicemail },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
]

function SidebarNavClient({ currentPage, navigate }: { currentPage: string; navigate: (page: string) => void }) {
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const links = user?.role === "admin" ? adminLinks : userLinks

  return (
    <aside
      className={cn(
        "sticky top-16 flex h-[calc(100vh-4rem)] flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-16" : "w-60"
      )}
    >
      <nav className="flex-1 overflow-y-auto px-2 py-4">
        <ul className="flex flex-col gap-1">
          {links.map((link) => {
            const isActive = currentPage === link.href
            const Icon = link.icon
            return (
              <li key={link.href}>
                <button
                  onClick={() => navigate(link.href)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </aside>
  )
}
