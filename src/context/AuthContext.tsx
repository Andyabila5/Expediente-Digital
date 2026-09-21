import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { API_BASE_URL } from '../utils/api'

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  username: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  // Arranca en true: necesitamos verificar la sesión antes de renderizar rutas
  const [isLoading, setIsLoading] = useState(true)

  // Al montar, comprobamos si ya hay una sesión válida en el backend (cookie HttpOnly)
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data?.username) setUsername(data.username)
      })
      .catch(() => {
        // Sin conexión o sin sesión — tratamos como no autenticado
      })
      .finally(() => setIsLoading(false))
  }, [])

  const value = useMemo<AuthContextType>(
    () => ({
      isAuthenticated: Boolean(username),
      isLoading,
      username,

      login: async (inputUsername, inputPassword) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include', // recibe la cookie HttpOnly
          body: JSON.stringify({
            username: inputUsername.trim().toLowerCase(),
            password: inputPassword,
          }),
        })

        const data = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(
            data?.message ?? 'No fue posible iniciar sesión. Intenta de nuevo.',
          )
        }

        setUsername(data.username)
      },

      logout: async () => {
        await fetch(`${API_BASE_URL}/api/auth/logout`, {
          method: 'POST',
          credentials: 'include', // envía y elimina la cookie HttpOnly
        }).catch(() => {
          // Si falla la red, igual limpiamos el estado local
        })
        setUsername(null)
      },
    }),
    [username, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}
