import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

interface AuthContextType {
  isAuthenticated: boolean
  username: string | null
  login: (username: string, password: string) => boolean
  logout: () => void
}

const SESSION_KEY = 'expediente-digital-session'
const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = 'admin123'

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(SESSION_KEY))

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: Boolean(username),
      username,
      login: (inputUsername, inputPassword) => {
        const normalizedUser = inputUsername.trim().toLowerCase()
        if (normalizedUser === DEFAULT_USERNAME && inputPassword === DEFAULT_PASSWORD) {
          localStorage.setItem(SESSION_KEY, DEFAULT_USERNAME)
          setUsername(DEFAULT_USERNAME)
          return true
        }
        return false
      },
      logout: () => {
        localStorage.removeItem(SESSION_KEY)
        setUsername(null)
      },
    }),
    [username],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
