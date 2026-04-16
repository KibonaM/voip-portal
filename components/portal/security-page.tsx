"use client"

import { ShieldCheck, ShieldAlert, Lock, Globe, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StatusBadge } from "./status-badge"
import { securityEvents, blockedIPs } from "@/lib/mock-data"

export function SecurityPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Security</h2>
        <p className="text-sm text-muted-foreground">System security settings and monitoring</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Login Threshold */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Lock className="h-4 w-4 text-primary" />
              Login Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Max Failed Login Attempts</Label>
              <Input type="number" defaultValue={5} className="w-32" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Lockout Duration (seconds)</Label>
              <Input type="number" defaultValue={300} className="w-32" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Session Timeout (minutes)</Label>
              <Input type="number" defaultValue={30} className="w-32" />
            </div>
            <Button className="w-fit bg-primary text-primary-foreground hover:bg-primary/90">
              Save Settings
            </Button>
          </CardContent>
        </Card>

        {/* Encryption Status */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Encryption Status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">TLS (Transport Layer Security)</span>
              <StatusBadge label="Active" variant="success" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">SRTP (Secure RTP)</span>
              <StatusBadge label="Active" variant="success" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Certificate Validity</span>
              <StatusBadge label="15 days remaining" variant="warning" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">HTTPS Enforcement</span>
              <StatusBadge label="Enabled" variant="success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Sessions */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Active Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {[
              { user: "Dr. Amina Mwangi", ip: "10.0.1.15", started: "2026-02-23 08:45", device: "Chrome / Windows" },
              { user: "John Kimaro", ip: "41.86.160.12", started: "2026-02-23 09:12", device: "Firefox / Linux" },
              { user: "Anna Mkapa", ip: "10.0.1.20", started: "2026-02-23 08:00", device: "Safari / macOS" },
            ].map((session, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">{session.user}</p>
                  <p className="text-xs text-muted-foreground">{session.ip} &middot; {session.device}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{session.started}</span>
                  <Button variant="outline" size="sm" className="h-7 text-xs border-border text-destructive hover:bg-destructive/10">
                    Terminate
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blocked IPs */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Globe className="h-4 w-4 text-primary" />
            Firewall / Blocked IPs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Blocked Since</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Auto Expiry</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody>
                {blockedIPs.map((ip, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 text-sm font-mono font-medium text-foreground">{ip.ip}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{ip.reason}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{ip.blockedSince}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={ip.autoExpiry}
                        variant={ip.autoExpiry === "Manual" ? "warning" : "info"}
                        dot={false}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Remove block</span>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Suspicious Activity */}
      <Card className="border border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <ShieldAlert className="h-4 w-4 text-warning" />
            Suspicious Activity Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {securityEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium text-foreground">{event.event}</p>
                  <p className="text-xs text-muted-foreground">{event.details}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge
                    label={event.severity}
                    variant={event.severity === "critical" ? "danger" : event.severity === "warning" ? "warning" : "info"}
                  />
                  <p className="text-xs text-muted-foreground">{event.source}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
