"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { ASTERISK_API } from "./mock-data"

export type UserRole = "admin" | "user"

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  extension: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  failedAttempts: number
  isLocked: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                   = useState<User | null>(null)
  const [failedAttempts, setFailedAttempts] = useState(0)
  const [isLocked, setIsLocked]           = useState(false)

  const login = async (email: string, password: string): Promise<boolean> => {
    if (isLocked) return false

    try {
      const res = await fetch(`${ASTERISK_API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (res.ok && data.user) {
        setUser({
          id:         data.user.id,
          name:       data.user.name,
          email:      data.user.email,
          role:       data.user.role as UserRole,
          department: data.user.department,
          extension:  data.user.extension,
        })
        setFailedAttempts(0)
        return true
      }

      // Failed login
      const newAttempts = failedAttempts + 1
      setFailedAttempts(newAttempts)
      if (newAttempts >= 5) {
        setIsLocked(true)
        setTimeout(() => {
          setIsLocked(false)
          setFailedAttempts(0)
        }, 30000)
      }
      return false

    } catch {
      // If server unreachable fall back to demo admin
      if (email === "admin@udsm.ac.tz" && password === "admin123") {
        setUser({
          id: "1",
          name: "Dr. Amina Mwangi",
          email: "admin@udsm.ac.tz",
          role: "admin",
          department: "Computing Centre (UCC)",
          extension: "1001",
        })
        return true
      }
      return false
    }
  }

  const logout = () => setUser(null)

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      failedAttempts,
      isLocked,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}