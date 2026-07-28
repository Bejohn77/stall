import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const loadSession = async () => {
    try {
      const token = sessionStorage.getItem('stall_token')
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      const { data } = await api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
      setUser(data.user)
    } catch (error) {
      sessionStorage.removeItem('stall_token')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSession()
  }, [])

  const login = async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    if (data.token) {
      sessionStorage.setItem('stall_token', data.token)
      setUser(data.user)
      return data
    }
    throw new Error(data.message || 'Login failed')
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      // ignore
    }
    sessionStorage.removeItem('stall_token')
    localStorage.removeItem('stall_token')
    setUser(null)
    navigate('/login')
    toast.success('Logged out successfully')
  }

  const value = useMemo(() => ({ user, loading, login, logout, setUser }), [user, loading, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
