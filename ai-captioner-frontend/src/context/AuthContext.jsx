import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, setUnauthorizedHandler, tokenStore } from '../lib/api'

const USER_KEY = 'user'
const AuthContext = createContext(null)

// Reads the JWT's exp claim so an expired session doesn't look logged in
function isTokenExpired(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

function loadSession() {
  const token = tokenStore.get()
  if (!token || isTokenExpired(token)) {
    tokenStore.clear()
    localStorage.removeItem(USER_KEY)
    return { token: null, user: null }
  }
  try {
    return { token, user: JSON.parse(localStorage.getItem(USER_KEY)) }
  } catch {
    return { token, user: null }
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession)

  const logout = useCallback(() => {
    tokenStore.clear()
    localStorage.removeItem(USER_KEY)
    setSession({ token: null, user: null })
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(logout)
    return () => setUnauthorizedHandler(null)
  }, [logout])

  const login = useCallback(async ({ email, password }) => {
    const { token, user } = await api.login({ email, password })
    tokenStore.set(token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))
    setSession({ token, user })
    return user
  }, [])

  const register = useCallback(
    async ({ username, email, password }) => {
      await api.register({ username, email, password })
      return login({ email, password })
    },
    [login],
  )

  const value = useMemo(
    () => ({ user: session.user, isAuthenticated: Boolean(session.token), login, register, logout }),
    [session, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
