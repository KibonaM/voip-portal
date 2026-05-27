"use client"

import { useEffect, useState } from "react"
import { Download, FileText, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"
import { ASTERISK_API, apiUrl, BridgePaths } from "@/lib/mock-data"

const PIE_COLORS = ["var(--primary)", "#10B981", "#F59E0B", "#EF4444"]

export function ReportsPage() {
  const [activeCalls, setActiveCalls]     = useState(0)
  const [totalExt, setTotalExt]           = useState(0)
  const [registeredExt, setRegisteredExt] = useState(0)
  const [lastRefresh, setLastRefresh]     = useState("—")
  const [cdrRecords, setCdrRecords]       = useState<any[]>([])
  const [deptFilter, setDeptFilter]       = useState("all")
  const [startDate, setStartDate]         = useState("2026-02-17")
  const [endDate, setEndDate]             = useState("2026-02-23")
  const [filteredRecords, setFilteredRecords] = useState<any[]>([])

  // ─── Fetch all live stats ─────────────────────────────────────────────────
  const fetchStats = async () => {
    try {
      const epRes = await fetch(apiUrl(ASTERISK_API, BridgePaths.endpoints))
      const endpoints = await epRes.json()
      setTotalExt(endpoints.length)
      setRegisteredExt(endpoints.filter((e: any) => e.state === "online").length)

      const chRes = await fetch(apiUrl(ASTERISK_API, BridgePaths.channels))
      const channels = await chRes.json()
      setActiveCalls(channels.length)

      // Fetch real CDR
      const cdrRes = await fetch(apiUrl(ASTERISK_API, BridgePaths.realcdr))
      const cdrData = await cdrRes.json()
      if (Array.isArray(cdrData)) {
        setCdrRecords(cdrData)
        setFilteredRecords(cdrData)
      }
    } catch { }
    setLastRefresh(new Date().toLocaleTimeString())
  }

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [])

  // ─── Generate filtered report ─────────────────────────────────────────────
  const handleGenerate = () => {
    let filtered = [...cdrRecords]
    if (startDate) filtered = filtered.filter(r => r.dateTime >= startDate)
    if (endDate)   filtered = filtered.filter(r => r.dateTime <= endDate + " 23:59:59")
    setFilteredRecords(filtered)
  }

  // ─── Build stats from filtered records ───────────────────────────────────
  const records = filteredRecords.length > 0 ? filteredRecords : cdrRecords
  const internal = records.filter(r => r.type === "Internal").length
  const inbound  = records.filter(r => r.type === "Inbound").length
  const outbound = records.filter(r => r.type === "Outbound").length
  const missed   = records.filter(r => r.type === "Missed").length
  const total    = records.length || 1

  const callTypeDistribution = [
    { name: "Internal", value: Math.round((internal / total) * 100) },
    { name: "Inbound",  value: Math.round((inbound  / total) * 100) },
    { name: "Outbound", value: Math.round((outbound / total) * 100) },
    { name: "Missed",   value: Math.round((missed   / total) * 100) },
  ]

  const weeklyData = [
    { day: "Mon", calls: records.filter(r => new Date(r.dateTime).getDay() === 1).length },
    { day: "Tue", calls: records.filter(r => new Date(r.dateTime).getDay() === 2).length },
    { day: "Wed", calls: records.filter(r => new Date(r.dateTime).getDay() === 3).length },
    { day: "Thu", calls: records.filter(r => new Date(r.dateTime).getDay() === 4).length },
    { day: "Fri", calls: records.filter(r => new Date(r.dateTime).getDay() === 5).length },
    { day: "Sat", calls: records.filter(r => new Date(r.dateTime).getDay() === 6).length },
    { day: "Sun", calls: records.filter(r => new Date(r.dateTime).getDay() === 0).length },
  ]

  // ─── Calls by department from real CDR ───────────────────────────────────
  const deptMap: Record<string, number> = {}
  records.forEach(r => {
    const dept = r.callerName ?? "Unknown"
    deptMap[dept] = (deptMap[dept] || 0) + 1
  })
  const callsPerDept = Object.entries(deptMap).map(([department, calls]) => ({ department, calls }))

  // ─── Export Report ────────────────────────────────────────────────────────
  const exportReport = () => {
    const headers = ["Metric", "Value"]
    const rows = [
      ["Total Extensions",      totalExt],
      ["Registered Extensions", registeredExt],
      ["Unregistered",          totalExt - registeredExt],
      ["Active Calls",          activeCalls],
      ["Total CDR Records",     cdrRecords.length],
      ["Internal Calls",        internal],
      ["Inbound Calls",         inbound],
      ["Outbound Calls",        outbound],
      ["Missed Calls",          missed],
    ]
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `udsm-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Reports</h2>
          <p className="text-sm text-muted-foreground">
            Analytics and call reporting · Last updated: {lastRefresh}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchStats}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Extensions</p>
            <p className="text-3xl font-bold text-foreground mt-1">{totalExt}</p>
            <p className="text-xs text-muted-foreground mt-1">On Asterisk PBX</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Registered</p>
            <p className="text-3xl font-bold text-green-500 mt-1">{registeredExt}</p>
            <p className="text-xs text-muted-foreground mt-1">Softphone online</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Calls</p>
            <p className="text-3xl font-bold text-primary mt-1">{activeCalls}</p>
            <p className="text-xs text-muted-foreground mt-1">Right now</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total CDR</p>
            <p className="text-3xl font-bold text-foreground mt-1">{cdrRecords.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Real call records</p>
          </CardContent>
        </Card>
      </div>

      {/* Report Filters */}
      <Card className="border border-border">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-2">
            <Label className="text-sm">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-sm">Department</Label>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="ucc">Computing Centre</SelectItem>
                <SelectItem value="cs">Computer Science</SelectItem>
                <SelectItem value="eng">Engineering</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={handleGenerate}
          >
            <FileText className="mr-2 h-4 w-4" />
            Generate
          </Button>
        </CardContent>
      </Card>

      {cdrRecords.length === 0 ? (
        <Card className="border border-border">
          <CardContent className="p-8 text-center text-muted-foreground text-sm">
            No CDR records yet. Charts will populate automatically once calls are made through the system.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Weekly Call Volume */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Weekly Call Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <YAxis tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--card-foreground)" }} />
                  <Bar dataKey="calls" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Call Type Distribution */}
          <Card className="border border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Call Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={callTypeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>
                    {callTypeDistribution.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Calls by Caller */}
          <Card className="border border-border lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Calls by User</CardTitle>
            </CardHeader>
            <CardContent>
              {callsPerDept.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={callsPerDept} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} />
                    <YAxis dataKey="department" type="category" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", borderRadius: "8px", color: "var(--card-foreground)" }} />
                    <Bar dataKey="calls" fill="var(--secondary)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}