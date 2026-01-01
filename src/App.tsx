// Forzar redeploy del frontend (actualización)
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import AdminDashboard from './components/AdminDashboard';
import CobradorDashboard from './components/CobradorDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import ResumenRutasPage from './components/ResumenRutasPage';
import API_URL from './config';

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
    // Guardar sesión en localStorage SIEMPRE (para restaurar tras recarga)
    // Pero borrar al cerrar la pestaña/ventana
    const initAuth = async () => {
      let token = localStorage.getItem('token')
      let sessionId = localStorage.getItem('sessionId')
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
          localStorage.removeItem('token')
          localStorage.removeItem('sessionId')
        }
      } catch (error) {
        console.error('Error validando sesión:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('sessionId')
      } finally {
        setLoading(false)
      }
    }
    initAuth()

    // Borrar sesión al cerrar la pestaña/ventana
    const handleBeforeUnload = () => {
      localStorage.removeItem('token')
      localStorage.removeItem('sessionId')
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark')
  }

  const handleLogin = (userData: User, keepLoggedIn: boolean) => {
    setUser(userData)
    localStorage.setItem('token', userData.token)
    localStorage.setItem('sessionId', userData.sessionId)
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
    localStorage.removeItem('token')
    localStorage.removeItem('sessionId')
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

  return (
    <Router>
      <Routes>
        {/* Login público */}
        {!user && (
          <Route path="/*" element={<Login onLogin={handleLogin} theme={theme} onToggleTheme={toggleTheme} />} />
        )}
        {/* Rutas protegidas */}
        {user && user.role === 'admin' && (
          <>
            <Route path="/" element={<AdminDashboard theme={theme} onToggleTheme={toggleTheme} user={user} onLogout={handleLogout} />} />
            <Route path="/resumen-rutas" element={<ResumenRutasPage adminId={user.id} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </>
        )}
        {user && user.role === 'superadmin' && (
          <Route path="/*" element={<SuperAdminDashboard theme={theme} onToggleTheme={toggleTheme} currentUser={user} onLogout={handleLogout} />} />
        )}
        {user && user.role === 'cobrador' && (
          <Route path="/*" element={
            <ErrorBoundary>
              <CobradorDashboard theme={theme} onToggleTheme={toggleTheme} user={user} onLogout={handleLogout} />
            </ErrorBoundary>
          } />
        )}
        {/* Fallback genérico */}
        {user && !['admin','superadmin','cobrador'].includes(user.role) && (
          <Route path="/*" element={<Dashboard theme={theme} onToggleTheme={toggleTheme} user={user} onLogout={handleLogout} />} />
        )}
      </Routes>
    </Router>
  );
}
