import React, { useState } from 'react'
import API_URL from '../config'
// Importar imágenes para compatibilidad Vite/React
import bgImage from '../assets/login-bg.png';
import logoImage from '../assets/rya-logo.png';

type Props = {
  onLogin: (user: { 
    id: number
    username: string
    nombre: string
    role: 'superadmin' | 'admin' | 'cobrador'
    adminId: number | null
    token: string
    sessionId: string
  }) => void
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

export default function Login({ onLogin, theme, onToggleTheme }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSuperAdminIP, setIsSuperAdminIP] = useState(false)
  const [checkingIP, setCheckingIP] = useState(true)
  const [selectedRole, setSelectedRole] = useState<'admin' | 'cobrador' | 'superadmin'>('admin')

  // Verificar IP al cargar el componente
  React.useEffect(() => {
    async function checkIP() {
      try {
        const response = await fetch(`${API_URL}/auth/check-ip`)
        const data = await response.json()
        
        console.log('Verificación IP:', data)
        setIsSuperAdminIP(data.isSuperAdmin)
      } catch (err) {
        console.error('Error verificando IP:', err)
      } finally {
        setCheckingIP(false)
      }
    }
    checkIP()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    
    // Si seleccionó SuperAdmin
    if (selectedRole === 'superadmin') {
      if (!isSuperAdminIP) {
        setError('Solo puedes acceder como SuperAdmin desde la IP autorizada')
        return
      }
      
      if (!password) {
        setError('Contraseña requerida')
        return
      }

      setLoading(true)

      try {
        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'superadmin', password })
        })

        if (!response.ok) {
          const data = await response.json()
          setError(data.message || 'Contraseña incorrecta')
          setLoading(false)
          return
        }

        const userData = await response.json()
        onLogin(userData)
      } catch (err) {
        console.error('Error en login:', err)
        setError('Error de conexión con el servidor')
        setLoading(false)
      }
      return
    }

    // Login normal para admin/cobrador
    if (!username || !password) {
      setError('Usuario y contraseña son requeridos')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.message || 'Credenciales inválidas')
        setLoading(false)
        return
      }

      const userData = await response.json()
      
      // Verificar que el rol del usuario coincida con el seleccionado
      if (userData.role !== selectedRole) {
        setError(`Este usuario no es ${selectedRole === 'admin' ? 'administrador' : 'cobrador'}`)
        setLoading(false)
        return
      }

      onLogin(userData)
    } catch (err) {
      console.error('Error en login:', err)
      setError('Error de conexión con el servidor')
      setLoading(false)
    }
  }

  if (checkingIP) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}>
        <div style={{ color: '#e6eef6', fontSize: '18px', background: 'rgba(10,18,32,0.7)', padding: 24, borderRadius: 16 }}>Verificando acceso...</div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(10, 18, 32, 0.82)',
        padding: '44px 32px 32px 32px',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '410px',
        border: '1.5px solid rgba(191, 167, 106, 0.25)',
        boxShadow: '0 12px 48px 0 rgba(31, 38, 135, 0.37)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* Logotipo */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          marginBottom: 18,
          borderRadius: 20,
          padding: 6,
          background: 'linear-gradient(135deg, #bfa76a 0%, #fffbe6 100%)',
          boxShadow: '0 0 0 4px rgba(191,167,106,0.18), 0 8px 32px 0 rgba(31,38,135,0.18)',
        }}>
          <div style={{
            borderRadius: 16,
            background: '#101828',
            padding: 0,
            boxShadow: '0 2px 12px 0 rgba(191,167,106,0.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <img src={logoImage} alt="RYA Logo" style={{ width: 90, height: 90, borderRadius: 16, objectFit: 'cover', background: 'rgba(0,0,0,0.2)' }} />
          </div>
        </div>
        <h1 style={{
          textAlign: 'center',
          color: '#e6eef6',
          marginBottom: '10px',
          fontSize: '28px',
          fontWeight: '600',
          letterSpacing: '1px',
          textShadow: '0 2px 8px rgba(0,0,0,0.10)'
        }}>
          Cobranzas
        </h1>
        <p style={{
          textAlign: 'center',
          color: '#bfa76a',
          marginBottom: '30px',
          fontSize: '15px',
          fontWeight: 500,
          letterSpacing: '0.5px',
          textShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          Selecciona tu rol e ingresa tus credenciales
        </p>

        <form onSubmit={handleSubmit}>
          {/* Selector de Rol */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#e6eef6',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Tipo de Usuario
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSelectedRole('admin')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedRole === 'admin' ? '2px solid #3b82f6' : '1px solid rgba(100, 200, 255, 0.3)',
                  background: selectedRole === 'admin' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  color: selectedRole === 'admin' ? '#60a5fa' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: selectedRole === 'admin' ? '600' : '400',
                  transition: 'all 0.3s'
                }}
              >
                🏢 Admin
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('cobrador')}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: selectedRole === 'cobrador' ? '2px solid #22c55e' : '1px solid rgba(100, 200, 255, 0.3)',
                  background: selectedRole === 'cobrador' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  color: selectedRole === 'cobrador' ? '#4ade80' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: selectedRole === 'cobrador' ? '600' : '400',
                  transition: 'all 0.3s'
                }}
              >
                🎯 Cobrador
              </button>
              {isSuperAdminIP && (
                <button
                  type="button"
                  onClick={() => setSelectedRole('superadmin')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '8px',
                    border: selectedRole === 'superadmin' ? '2px solid #f59e0b' : '1px solid rgba(100, 200, 255, 0.3)',
                    background: selectedRole === 'superadmin' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                    color: selectedRole === 'superadmin' ? '#fbbf24' : '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: selectedRole === 'superadmin' ? '600' : '400',
                    transition: 'all 0.3s'
                  }}
                >
                  👑 Super
                </button>
              )}
            </div>
          </div>

          {/* Campo Usuario (solo si NO es SuperAdmin) */}
          {selectedRole !== 'superadmin' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                color: '#e6eef6',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ingresa tu usuario"
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(100, 200, 255, 0.3)',
                  background: 'rgba(15, 23, 42, 0.5)',
                  color: '#e6eef6',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = 'rgba(100, 200, 255, 0.6)'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(100, 200, 255, 0.3)'}
              />
            </div>
          )}

          {/* Campo Contraseña */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#e6eef6',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              {selectedRole === 'superadmin' ? 'IP de Acceso' : 'Contraseña'}
            </label>
            <input
              type={selectedRole === 'superadmin' ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={selectedRole === 'superadmin' ? 'Ingresa tu IP' : 'Ingresa tu contraseña'}
              autoComplete="current-password"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(100, 200, 255, 0.3)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#e6eef6',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(100, 200, 255, 0.6)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(100, 200, 255, 0.3)'}
            />
          </div>



          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '8px',
              border: 'none',
              background: loading ? '#64748b' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: '#fff',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              if (!loading) e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        {selectedRole === 'superadmin' && (
          <div style={{
            marginTop: '24px',
            padding: '16px',
            borderRadius: '8px',
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.2)'
          }}>
            <p style={{
              color: '#fbbf24',
              fontSize: '13px',
              margin: 0,
              textAlign: 'center'
            }}>
              👑 <strong>Acceso SuperAdmin</strong><br />
              <span style={{ color: '#94a3b8', fontSize: '12px' }}>
                La contraseña es tu dirección IP actual
              </span>
            </p>
          </div>
        )}
        
        {/* Pie de página elegante */}
        <div style={{
          marginTop: '24px',
          color: '#bfa76a',
          fontSize: '1.08rem',
          fontWeight: 500,
          textAlign: 'center',
          letterSpacing: '0.5px',
          textShadow: '0 1px 4px rgba(0,0,0,0.04)'
        }}>
          Bienvenido a Collections Manager
        </div>
      </div>
    </div>
  )
}
