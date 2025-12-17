import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import SuperAdminDashboard from './components/SuperAdminDashboard'
import AdminDashboard from './components/AdminDashboard'
import CobradorDashboard from './components/CobradorDashboard'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './components/Login'
import API_URL from './config'

interface User {
  id: number
  username: string
  nombre: string
  role: 'superadmin' | 'admin' | 'cobrador'
  adminId: number | null
  token: string
  sessionId: string
}

export default function App() {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme')
    return (saved as 'dark' | 'light') || 'dark'
  })

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    // Validar sesión existente solo en sessionStorage
    const initAuth = async () => {
      const token = sessionStorage.getItem('token')
      const sessionId = sessionStorage.getItem('sessionId')
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_URL}/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
        if (res.ok) {
          const userData = await res.json()
          setUser({ ...userData, token, sessionId })
        } else {
          sessionStorage.removeItem('token')
          sessionStorage.removeItem('sessionId')
        }
      } catch (error) {
        console.error('Error validando sesión:', error)
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('sessionId')
      } finally {
        setLoading(false)
      }
    }
    initAuth()
    // La sesión se mantiene hasta que se cierre la pestaña/app
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleLogin = (userData: User) => {
    setUser(userData)
    sessionStorage.setItem('token', userData.token)
    sessionStorage.setItem('sessionId', userData.sessionId)
  }

  const handleLogout = async () => {
    // Verificar si estamos impersonando
    const isImpersonating = sessionStorage.getItem('isImpersonating')
    const superAdminSessionStr = sessionStorage.getItem('superAdminSession')
    if (isImpersonating && superAdminSessionStr) {
      try {
        const superAdminSession = JSON.parse(superAdminSessionStr)
        const token = sessionStorage.getItem('token')
        if (token) {
          await fetch(`${API_URL}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          })
        }
        // Limpiar flags de impersonación
        sessionStorage.removeItem('isImpersonating')
        sessionStorage.removeItem('superAdminSession')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('sessionId')
        window.location.reload()
        return
      } catch (error) {
        console.error('Error restaurando sesión de SuperAdmin:', error)
      }
    }
    // Logout normal
    const token = sessionStorage.getItem('token')
    if (token) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })
      } catch (error) {
        console.error('Error al cerrar sesión:', error)
      }
    }
    setUser(null)
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('sessionId')
    sessionStorage.removeItem('isImpersonating')
    sessionStorage.removeItem('superAdminSession')
  }

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        background: 'var(--bg-primary)'
      }}>
        <div style={{ color: 'var(--text-primary)' }}>Cargando...</div>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />
  }

  // Renderizar interfaz según rol
  if (user.role === 'superadmin') {
    return (
      <div className="app-root">
        <SuperAdminDashboard 
          theme={theme} 
          onToggleTheme={toggleTheme}
          currentUser={user}
          onLogout={handleLogout}
        />
      </div>
    )
  }

  if (user.role === 'admin') {
    return (
      <div className="app-root">
        <AdminDashboard 
          theme={theme} 
          onToggleTheme={toggleTheme}
          user={user}
          onLogout={handleLogout}
        />
      </div>
    )
  }

  if (user.role === 'cobrador') {
    return (
      <div className="app-root">
        <ErrorBoundary>
          <CobradorDashboard 
            theme={theme} 
            onToggleTheme={toggleTheme}
            user={user}
            onLogout={handleLogout}
          />
        </ErrorBoundary>
      </div>
    )
  }

  // Fallback al Dashboard genérico
  return (
    <div className="app-root">
      <Dashboard 
        theme={theme} 
        onToggleTheme={toggleTheme}
        user={user}
        onLogout={handleLogout}
      />
    </div>
  )
}
