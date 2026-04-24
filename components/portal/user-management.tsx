"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Edit, UserX, RefreshCw, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { StatusBadge } from "./status-badge"
import { departments, ASTERISK_API, fetchLiveEndpoints } from "@/lib/mock-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

type User = {
  id: string
  name: string
  email: string
  department: string
  role: string
  extension: string
  status: string
  lastLogin: string
  online?: boolean
  password?: string
  mustChangePassword?: boolean
}

export function UserManagement() {
  const [search, setSearch]           = useState("")
  const [deptFilter, setDeptFilter]   = useState("all")
  const [showModal, setShowModal]     = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [usersList, setUsersList]     = useState<User[]>([])
  const [loading, setLoading]         = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [error, setError]             = useState("")
  const [success, setSuccess]         = useState("")
  const [editError, setEditError]     = useState("")
  const [editSuccess, setEditSuccess] = useState("")
  const [generatedPassword, setGeneratedPassword] = useState("")
  const [lastRefresh, setLastRefresh] = useState("—")

  const [form, setForm] = useState({
    name: "", email: "", department: "", role: "user", extension: "", remoteAccess: false,
  })

  const [editForm, setEditForm] = useState({
    name: "", email: "", department: "", role: "user",
  })

  // ─── Generate strong password ─────────────────────────────────────────────
  const generatePassword = (extension: string) => {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const specials  = ["@", "#", "!", "$", "%"]
    const special   = specials[Math.floor(Math.random() * specials.length)]
    return `UDSM${special}${extension}#${randomNum}`
  }

  // ─── Load users ───────────────────────────────────────────────────────────
  const loadUsers = async () => {
    setPageLoading(true)
    try {
      const res = await fetch(`${ASTERISK_API}/users`)
      const data = await res.json()
      if (Array.isArray(data)) setUsersList(data)
    } catch {
      setUsersList([])
    }
    setPageLoading(false)
  }

  // ─── Sync online status ───────────────────────────────────────────────────
  const syncOnlineStatus = async () => {
    const endpoints = await fetchLiveEndpoints()
    if (endpoints) {
      setUsersList(prev => prev.map(u => {
        const ep = endpoints.find((e: any) => e.resource === u.extension)
        return ep ? { ...u, online: ep.state === "online" } : { ...u, online: false }
      }))
    }
    setLastRefresh(new Date().toLocaleTimeString())
  }

  useEffect(() => {
    loadUsers().then(() => syncOnlineStatus())
    const interval = setInterval(syncOnlineStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // ─── Fetch next extension ─────────────────────────────────────────────────
  const fetchNextExtension = async () => {
    try {
      const res = await fetch(`${ASTERISK_API}/nextextension`)
      const data = await res.json()
      const ext = data.next
      setForm(f => ({ ...f, extension: ext }))
      setGeneratedPassword(generatePassword(ext))
    } catch {
      setForm(f => ({ ...f, extension: "1005" }))
      setGeneratedPassword(generatePassword("1005"))
    }
  }

  const filtered = usersList.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
    const matchesDept = deptFilter === "all" || u.department === deptFilter
    return matchesSearch && matchesDept
  })

  const totalUsers     = usersList.length
  const activeUsers    = usersList.filter(u => u.status === "active").length
  const onlineUsers    = usersList.filter(u => u.online).length
  const suspendedUsers = usersList.filter(u => u.status === "suspended").length

  // ─── Open Edit Modal ──────────────────────────────────────────────────────
  const openEdit = (user: User) => {
    setEditingUser(user)
    setEditForm({
      name:       user.name,
      email:      user.email,
      department: user.department,
      role:       user.role,
    })
    setEditError("")
    setEditSuccess("")
    setShowEditModal(true)
  }

  // ─── Save Edit ────────────────────────────────────────────────────────────
  const handleSaveEdit = async () => {
    if (!editForm.name || !editForm.email) {
      setEditError("Name and email are required")
      return
    }
    setEditLoading(true)
    setEditError("")
    try {
      const res = await fetch(`${ASTERISK_API}/users/${editingUser?.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:       editForm.name,
          email:      editForm.email,
          department: editForm.department,
          role:       editForm.role,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setEditError(data.error || "Failed to update user")
      } else {
        setUsersList(prev =>
          prev.map(u => u.id === editingUser?.id
            ? { ...u, name: editForm.name, email: editForm.email, department: editForm.department, role: editForm.role }
            : u
          )
        )
        setEditSuccess("✅ User updated successfully!")
        setTimeout(() => {
          setShowEditModal(false)
          setEditSuccess("")
        }, 1500)
      }
    } catch {
      setEditError("Cannot connect to server.")
    }
    setEditLoading(false)
  }

  // ─── Create User ──────────────────────────────────────────────────────────
  const handleCreateUser = async () => {
    if (!form.name || !form.email || !form.department) {
      setError("Please fill in all required fields")
      return
    }
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      const password = generatedPassword || generatePassword(form.extension)

      const extRes = await fetch(`${ASTERISK_API}/extensions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ extension: form.extension, password }),
      })
      const extData = await extRes.json()
      if (!extRes.ok) {
        setError(extData.error || "Failed to create extension on Asterisk")
        setLoading(false)
        return
      }

      const newUser: User = {
        id: String(Date.now()),
        name: form.name,
        email: form.email,
        department: form.department,
        role: form.role,
        extension: form.extension,
        status: "active",
        lastLogin: new Date().toISOString().slice(0, 16).replace("T", " "),
        online: false,
        password: password,
        mustChangePassword: true,
      }

      const userRes = await fetch(`${ASTERISK_API}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      })

      if (userRes.ok) {
        setUsersList(prev => [...prev, newUser])
        setSuccess(
          `✅ User created!\nExtension: ${form.extension}\nPassword: ${password}\n⚠️ User must change password on first login.`
        )
      }

      setForm({ name: "", email: "", department: "", role: "user", extension: "", remoteAccess: false })
      setGeneratedPassword("")
      fetchNextExtension()
      setTimeout(() => { setShowModal(false); setSuccess("") }, 5000)
    } catch {
      setError("Cannot connect to Asterisk backend.")
    }
    setLoading(false)
  }

  // ─── Suspend/Activate ─────────────────────────────────────────────────────
  const toggleSuspend = async (user: User) => {
    const newStatus = user.status === "active" ? "suspended" : "active"
    if (!confirm(`${newStatus === "suspended" ? "Suspend" : "Activate"} ${user.name}?`)) return
    try {
      await fetch(`${ASTERISK_API}/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, online: false }),
      })
      setUsersList(prev =>
        prev.map(u => u.id === user.id ? { ...u, status: newStatus, online: false } : u)
      )
    } catch {
      alert("Failed to update user status")
    }
  }

  // ─── Delete User ──────────────────────────────────────────────────────────
  const handleDelete = async (user: User) => {
    if (!confirm(`Permanently delete ${user.name} (Ext. ${user.extension}) from portal and Asterisk?\n\nThis cannot be undone.`)) return
    try {
      await fetch(`${ASTERISK_API}/extensions/${user.extension}`, { method: "DELETE" })
      await fetch(`${ASTERISK_API}/users/${user.id}`, { method: "DELETE" })
      setUsersList(prev => prev.filter(u => u.id !== user.id))
    } catch {
      alert("Cannot connect to Asterisk backend.")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage portal users · Live sync from Asterisk · {lastRefresh}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { loadUsers(); syncOnlineStatus(); }}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button
            onClick={() => { setShowModal(true); fetchNextExtension(); }}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Users</p>
            <p className="text-3xl font-bold text-foreground mt-1">{totalUsers}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Active</p>
            <p className="text-3xl font-bold text-green-500 mt-1">{activeUsers}</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Online Now</p>
            <p className="text-3xl font-bold text-primary mt-1">{onlineUsers}</p>
            <p className="text-xs text-muted-foreground mt-1">Live from Asterisk</p>
          </CardContent>
        </Card>
        <Card className="border border-border">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Suspended</p>
            <p className="text-3xl font-bold text-destructive mt-1">{suspendedUsers}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Users Table */}
      <Card className="border border-border">
        <CardContent className="p-0">
          {pageLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">Loading users from server...</div>
          ) : usersList.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No users yet. Click <strong>Add User</strong> to create the first user.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extension</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Presence</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Login</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user) => (
                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                            {user.mustChangePassword && (
                              <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/30 rounded px-1.5 py-0.5">
                                Must change pwd
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{user.department}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={user.role} variant={user.role === "admin" ? "info" : "neutral"} dot={false} />
                      </td>
                      <td className="px-4 py-3 text-sm font-mono font-bold text-foreground">{user.extension}</td>
                      <td className="px-4 py-3">
                        <StatusBadge label={user.status} variant={user.status === "active" ? "success" : "danger"} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${user.online ? "bg-green-500" : "bg-muted-foreground"}`} />
                          <span className="text-xs text-muted-foreground">{user.online ? "Online" : "Offline"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{user.lastLogin}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => openEdit(user)}
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className={`h-8 w-8 ${user.status === "active" ? "text-muted-foreground hover:text-amber-500" : "text-amber-500 hover:text-green-500"}`}
                            onClick={() => toggleSuspend(user)}
                            title={user.status === "active" ? "Suspend user" : "Activate user"}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(user)}
                            title="Delete user and extension from Asterisk"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* ── Edit User Modal ─────────────────────────────────────────────────── */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User — Ext. {editingUser?.extension}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {editError && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                {editError}
              </div>
            )}
            {editSuccess && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2 text-sm text-green-600">
                {editSuccess}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label>Full Name *</Label>
              <Input
                value={editForm.name}
                onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Full name"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Email Address *</Label>
              <Input
                type="email"
                value={editForm.email}
                onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                placeholder="name@udsm.ac.tz"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Department</Label>
              <Select value={editForm.department} onValueChange={v => setEditForm(f => ({ ...f, department: v }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Extension</Label>
              <Input value={editingUser?.extension || ""} disabled className="bg-muted font-mono font-bold" />
              <p className="text-xs text-muted-foreground">Extension cannot be changed</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleSaveEdit}
              disabled={editLoading}
            >
              {editLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add User Modal ──────────────────────────────────────────────────── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            {error && (
              <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg bg-green-500/10 border border-green-500/30 px-3 py-2 text-sm text-green-600 whitespace-pre-line">
                {success}
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label>Full Name *</Label>
              <Input placeholder="Enter full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Email Address *</Label>
              <Input placeholder="name@udsm.ac.tz" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Department *</Label>
              <Select onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select defaultValue="user" onValueChange={v => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Auto-assigned Extension</Label>
              <Input value={form.extension || "Loading..."} disabled className="bg-muted font-mono font-bold text-lg" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Auto-generated Password</Label>
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2">
                <p className="text-sm font-mono font-bold text-amber-700">{generatedPassword || "Loading..."}</p>
                <p className="text-xs text-amber-600 mt-1">⚠️ Share this with the user. They must change it on first login.</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Enable Remote Access</Label>
              <Switch checked={form.remoteAccess} onCheckedChange={v => setForm(f => ({ ...f, remoteAccess: v }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={handleCreateUser}
              disabled={loading || !form.extension}
            >
              {loading ? "Creating..." : "Create User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}