"use client"

import { AuthProvider } from "@/lib/auth-context"
import { LoginPage } from "@/components/portal/login-page"
import { PortalRouter } from "@/components/portal/portal-router"
import { useAuth } from "@/lib/auth-context"

function AppContent() {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <LoginPage />
  return <PortalRouter />
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
