"use client"

import { useState, useEffect } from "react"
import { Search, Eye, Settings, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { StatusBadge } from "./status-badge"
import {
  fetchLiveEndpoints,
  ASTERISK_API,
  apiUrl,
  BridgePaths,
} from "@/lib/mock-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type LiveEndpoint = {
  extension: string
  assignedUser: string
  department: string
  registrationStatus: string
  network: string
  encryption: string
  lastIp: string
  state: string
}

export function ExtensionManagement() {
  const [search, setSearch] = useState("")
  const [selectedExt, setSelectedExt] = useState<LiveEndpoint | null>(null)
  const [endpoints, setEndpoints] = useState<LiveEndpoint[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState("—")

  // ─── Fetch live endpoints from Asterisk ──────────────────────────────────
const fetchEndpoints = async () => {
    setLoading(true)

    // Fetch users from server
    let serverUsers: any[] = []
    try {
      const usersRes = await fetch(apiUrl(ASTERISK_API, BridgePaths.users))
      const rawUsers = await usersRes.json()
      serverUsers = Array.isArray(rawUsers) ? rawUsers : []
    } catch { }

    const liveData = await fetchLiveEndpoints()
    const liveList = Array.isArray(liveData) ? liveData : []

    const extKey = (ep: any) => String(ep?.resource ?? ep?.extension ?? "").trim()

    let merged: LiveEndpoint[] = []
    if (liveList.length > 0) {
      merged = liveList
        .map((ep: any) => {
          const ext = extKey(ep)
          const matchedUser = serverUsers.find(
            (u: any) => String(u.extension) === ext
          )
          return {
            extension: ext,
            assignedUser: matchedUser?.name ?? "Unassigned",
            department: matchedUser?.department ?? "—",
            registrationStatus:
              ep.state === "online" ? "registered" : "unregistered",
            network: "LAN",
            encryption: "TLS/SRTP",
            lastIp: "—",
            state: ep.state ?? "offline",
          }
        })
        .filter((row) => row.extension.length > 0)
    } else if (serverUsers.length > 0) {
      merged = serverUsers
        .filter((u: any) => u.extension != null && String(u.extension).trim() !== "")
        .map((u: any) => ({
          extension: String(u.extension),
          assignedUser: u.name ?? "—",
          department: u.department ?? "—",
          registrationStatus: "unregistered",
          network: "LAN",
          encryption: "TLS/SRTP",
          lastIp: "—",
          state: "offline",
        }))
    }

    setEndpoints(merged)

    setLastRefresh(new Date().toLocaleTimeString())
    setLoading(false)
  }

  useEffect(() => {
    fetchEndpoints()
    const interval = setInterval(fetchEndpoints, 5000)
    return () => clearInterval(interval)
  }, [])

  // ─── Delete extension ─────────────────────────────────────────────────────
  const handleDelete = async (ext: string) => {
    if (!confirm(`Delete extension ${ext} from Asterisk?`)) return
    try {
      const res = await fetch(apiUrl(ASTERISK_API, BridgePaths.extensions, ext), {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        setEndpoints(prev => prev.filter(e => e.extension !== ext))
        alert(`Extension ${ext} deleted from Asterisk`)
      }
    } catch {
      alert("Failed to delete extension")
    }
  }

  const filtered = endpoints.filter((ext) =>
    ext.extension.includes(search) ||
    ext.assignedUser.toLowerCase().includes(search.toLowerCase())
  )

  const registered = endpoints.filter(e => e.state === "online").length
  const unregistered = endpoints.filter(e => e.state !== "online").length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Extension Management</h2>
          <p className="text-sm text-muted-foreground">Live SIP extensions from Asterisk PBX</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">Last updated: {lastRefresh}</span>
          <Button variant="outline" size="sm" onClick={fetchEndpoints}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Extensions</p>
            <p className="text-3xl font-bold text-foreground mt-1">{endpoints.length}</p>
            <p className="text-xs text-muted-foreground mt-1">On Asterisk PBX</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Registered</p>
            <p className="text-3xl font-bold text-green-500 mt-1">{registered}</p>
            <p className="text-xs text-muted-foreground mt-1">Softphone connected</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Unregistered</p>
            <p className="text-3xl font-bold text-destructive mt-1">{unregistered}</p>
            <p className="text-xs text-muted-foreground mt-1">No softphone</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search extensions or users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Card className="border border-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Loading live data from Asterisk...
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extension</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assigned User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Registration</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Network</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Encryption</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ext) => (
                  <tr key={ext.extension} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-semibold text-foreground">{ext.extension}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{ext.assignedUser}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{ext.department}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={ext.registrationStatus}
                        variant={ext.registrationStatus === "registered" ? "success" : "danger"}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={ext.network}
                        variant="info"
                        dot={false}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={ext.encryption}
                        variant="success"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedExt(ext)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(ext.extension)}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </CardContent>
      </Card>

      {/* Extension Detail Modal */}
      <Dialog open={!!selectedExt} onOpenChange={() => setSelectedExt(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Extension {selectedExt?.extension} Details</DialogTitle>
          </DialogHeader>
          {selectedExt && (
            <div className="flex flex-col gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Assigned User</p>
                  <p className="text-sm font-medium text-foreground">{selectedExt.assignedUser}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Department</p>
                  <p className="text-sm font-medium text-foreground">{selectedExt.department}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SIP Status</p>
                  <StatusBadge
                    label={selectedExt.registrationStatus}
                    variant={selectedExt.registrationStatus === "registered" ? "success" : "danger"}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Protocol</p>
                  <p className="text-sm font-mono text-foreground">PJSIP / UDP</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Network</p>
                  <StatusBadge label={selectedExt.network} variant="info" dot={false} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Encryption</p>
                  <StatusBadge label={selectedExt.encryption} variant="success" />
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="text-sm font-medium">Remote Access</span>
                <Switch defaultChecked={false} />
              </div>
              <div className="border-t border-border pt-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Asterisk PBX Info
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedExt.state === "online" ? "bg-green-500" : "bg-destructive"}`} />
                    <span>State: {selectedExt.state}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Technology: PJSIP</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>Context: internal</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}