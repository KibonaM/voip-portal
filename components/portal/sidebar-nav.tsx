"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
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
  MonitorSmartphone,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"

const adminLinks = [
  { href: "/dashboard",                label: "Dashboard",    icon: LayoutDashboard },
  { href: "/dashboard/users",          label: "Users",        icon: Users },
  { href: "/dashboard/extensions",     label: "Extensions",   icon: Phone },
  { href: "/dashboard/directory",      label: "Live Directory", icon: BookOpen },
  { href: "/dashboard/call-records",   label: "Call Records", icon: PhoneCall },
  { href: "/dashboard/monitoring",     label: "Monitoring",   icon: Activity },
  { href: "/dashboard/reports",        label: "Reports",      icon: BarChart3 },
  { href: "/dashboard/security",       label: "Security",     icon: ShieldAlert },
  { href: "/dashboard/audit-logs",     label: "Audit Logs",   icon: FileText },
  { href: "/dashboard/settings",       label: "Settings",     icon: Settings },
]

const userLinks = [
  { href: "/dashboard",              label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/directory",    label: "Directory", icon: BookOpen },
  { href: "/dashboard/my-calls",     label: "My Calls",  icon: PhoneCall },
  { href: "/dashboard/voicemail",    label: "Voicemail", icon: Voicemail },
  { href: "/dashboard/settings",     label: "Settings",  icon: Settings },
]

// ─── Live PBX Status Component ───────────────────────────────────────────────
function PbxStatus() {
  const [online, setOnline]   = useState(false)
  const [version, setVersion] = useState("—")

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("http://192.168.1.13:3001/api/info")
        const data = await res.json()
        if (data?.system?.version) {
          setVersion(data.system.version)
          setOnline(true)
        }
      } catch {
        setOnline(false)
      }
    }
    check()
    const interval = setInterval(check, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="mb-2 flex items-center gap-2 px-3 py-2">
      <MonitorSmartphone className="h-4 w-4 text-sidebar-foreground/50 shrink-0" />
      <div className="text-xs text-sidebar-foreground/50">
        <div className="font-medium">Asterisk {version}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className={`h-1.5 w-1.5 rounded-full ${online ? "bg-green-500" : "bg-red-500"}`} />
          <span>{online ? "Online" : "Offline"}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Sidebar Nav ──────────────────────────────────────────────────────────────
export function SidebarNav() {
  const pathname  = usePathname()
  const { user }  = useAuth()
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
            const isActive = pathname === link.href || (link.href !== "/dashboard" && pathname?.startsWith(link.href))
            const Icon = link.icon
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  title={collapsed ? link.label : undefined}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{link.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-2">
        {!collapsed && <PbxStatus />}
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