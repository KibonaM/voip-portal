"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Bell, Search, LogOut, ChevronDown, Shield, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-context"
import { ASTERISK_API, fetchLiveEndpoints } from "@/lib/mock-data"

type Notification = {
  id: string
  title: string
  message: string
  type: "warning" | "info" | "danger"
  time: string
}

export function TopNavbar() {
  const { user, logout } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  // ─── Build real notifications from Asterisk ───────────────────────────────
  const fetchNotifications = async () => {
    const notifs: Notification[] = []

    try {
      // Check unregistered extensions
      const endpoints = await fetchLiveEndpoints()
      if (endpoints) {
        const unregistered = endpoints.filter((e: any) => e.state !== "online").length
        if (unregistered > 0) {
          notifs.push({
            id: "unreg",
            title: "Unregistered Extensions",
            message: `${unregistered} extension(s) are not registered`,
            type: "warning",
            time: new Date().toLocaleTimeString(),
          })
        }
      }

      // Check active calls
      const chRes = await fetch(`${ASTERISK_API}/channels`)
      const channels = await chRes.json()
      if (Array.isArray(channels) && channels.length > 0) {
        notifs.push({
          id: "calls",
          title: "Active Calls",
          message: `${channels.length} call(s) in progress right now`,
          type: "info",
          time: new Date().toLocaleTimeString(),
        })
      }

      // Check system stats
      const sysRes = await fetch(`${ASTERISK_API}/system`)
      const sysData = await sysRes.json()
      if (sysData?.cpu > 80) {
        notifs.push({
          id: "cpu",
          title: "High CPU Usage",
          message: `Server CPU at ${sysData.cpu}%`,
          type: "danger",
          time: new Date().toLocaleTimeString(),
        })
      }
      if (sysData?.memory > 85) {
        notifs.push({
          id: "mem",
          title: "High Memory Usage",
          message: `Server memory at ${sysData.memory}%`,
          type: "danger",
          time: new Date().toLocaleTimeString(),
        })
      }

      // Check audit logs for recent actions
      const auditRes = await fetch(`${ASTERISK_API}/audit`)
      const auditData = await auditRes.json()
      if (Array.isArray(auditData) && auditData.length > 0) {
        const latest = auditData[0]
        notifs.push({
          id: "audit",
          title: "Recent Admin Action",
          message: `${latest.action}: ${latest.target}`,
          type: "info",
          time: latest.timestamp,
        })
      }

    } catch { }

    setNotifications(notifs)
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000)
    return () => clearInterval(interval)
  }, [])

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const notifColor = (type: string) => {
    if (type === "danger")  return "border-red-200 bg-red-50 text-red-700"
    if (type === "warning") return "border-yellow-200 bg-yellow-50 text-yellow-700"
    return "border-blue-200 bg-blue-50 text-blue-700"
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border bg-primary px-6">
      <div className="flex items-center gap-3">
        <Image
          src="/images/udsm-logo.png"
          alt="UDSM Logo"
          width={40}
          height={40}
          className="rounded-full bg-primary-foreground p-0.5"
        />
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-secondary" />
          <h1 className="text-lg font-semibold text-primary-foreground hidden md:block">
            Secure VoIP Portal
          </h1>
          <h1 className="text-sm font-semibold text-primary-foreground md:hidden">
            VoIP Portal
          </h1>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users, extensions..."
            className="w-64 bg-primary-foreground/10 pl-9 text-primary-foreground placeholder:text-primary-foreground/50 border-primary-foreground/20 focus:bg-primary-foreground/20"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell className="h-5 w-5" />
            {notifications.length > 0 && (
              <Badge className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive p-0 text-[10px] text-primary-foreground">
                {notifications.length}
              </Badge>
            )}
          </Button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border border-border bg-card shadow-xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">
                  Notifications ({notifications.length})
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setShowNotifications(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col gap-2 p-3 max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No notifications
                  </p>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`flex items-start justify-between gap-2 rounded-lg border p-3 text-xs ${notifColor(n.type)}`}
                    >
                      <div>
                        <p className="font-semibold">{n.title}</p>
                        <p className="mt-0.5 opacity-80">{n.message}</p>
                        <p className="mt-1 opacity-60">{n.time}</p>
                      </div>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="opacity-60 hover:opacity-100 shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden text-left lg:block">
                <p className="text-sm font-medium text-primary-foreground">{user?.name || "User"}</p>
                <p className="text-xs text-primary-foreground/70 capitalize">{user?.role || "user"}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-primary-foreground/70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">Ext. {user?.extension}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}