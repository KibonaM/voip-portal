"use client"

import { useState } from "react"
import { Save, Bell, Shield, Phone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"

export function SettingsPage() {
  const { user } = useAuth()
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [callAlerts, setCallAlerts] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)

  const handleSave = () => {
    toast.success("Settings saved successfully")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your portal and call preferences</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile Settings */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Full Name</Label>
              <Input defaultValue={user?.name || ""} />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Email</Label>
              <Input defaultValue={user?.email || ""} type="email" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Department</Label>
              <Input defaultValue={user?.department || ""} disabled className="bg-muted" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Extension</Label>
              <Input defaultValue={user?.extension || ""} disabled className="bg-muted" />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Bell className="h-4 w-4 text-primary" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive email alerts for important events</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Missed Call Alerts</p>
                <p className="text-xs text-muted-foreground">Get notified for missed calls</p>
              </div>
              <Switch checked={callAlerts} onCheckedChange={setCallAlerts} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Security Alerts</p>
                <p className="text-xs text-muted-foreground">Alerts for suspicious login activity</p>
              </div>
              <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
            </div>
          </CardContent>
        </Card>

        {/* Call Settings */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Phone className="h-4 w-4 text-primary" />
              Call Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Ring Timeout (seconds)</Label>
              <Select defaultValue="30">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 seconds</SelectItem>
                  <SelectItem value="30">30 seconds</SelectItem>
                  <SelectItem value="45">45 seconds</SelectItem>
                  <SelectItem value="60">60 seconds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Call Forwarding Number</Label>
              <Input placeholder="Enter forwarding number" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Voicemail</p>
                <p className="text-xs text-muted-foreground">Enable voicemail when unavailable</p>
              </div>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="border border-border">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="h-4 w-4 text-primary" />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Current Password</Label>
              <Input type="password" placeholder="Enter current password" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm">New Password</Label>
              <Input type="password" placeholder="Enter new password" />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-sm">Confirm New Password</Label>
              <Input type="password" placeholder="Confirm new password" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Save className="mr-2 h-4 w-4" />
          Save All Settings
        </Button>
      </div>
    </div>
  )
}
