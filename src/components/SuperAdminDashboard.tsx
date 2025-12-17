import React, { useEffect, useState } from 'react'
import AdminDetailsModal from './AdminDetailsModal'
import SolicitudesCobradoresModal from './SolicitudesCobradoresModal'

type User = {
  id: number
  username: string
  nombre: string
  role: 'superadmin' | 'admin' | 'cobrador'
  adminId: number | null
  createdAt: string
}

type Props = {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  onLogout: () => void
  currentUser: {
    id: number
    username: string
    nombre: string
    role: string
    token: string
  }
}

export default function SuperAdminDashboard({ theme, onToggleTheme, onLogout, currentUser }: Props) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showNewUser, setShowNewUser] = useState(false)
  const [showSolicitudes, setShowSolicitudes] = useState(false)
  const [selectedAdminId, setSelectedAdminId] = useState<number | null>(null)
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0)
  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    nombre: '',
    role: 'admin' as 'admin' | 'cobrador'
  })

  useEffect(() => {
    loadUsers()
    loadPendingRequests()
    
    // Actualizar solicitudes pendientes cada 30 segundos
    const interval = setInterval(loadPendingRequests, 30000)
    return () => clearInterval(interval)
  }, [])

  async function loadUsers() {
    try {
      const res = await fetch('/api/auth/users', {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadPendingRequests() {
    try {
      const res = await fetch('/api/auth/cobrador-requests', {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const pending = data.filter((r: any) => r.status === 'pending').length
        setPendingRequestsCount(pending)
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error)
    }
  }

  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    
    try {
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(newUser)
      })

      if (res.ok) {
        setShowNewUser(false)
        setNewUser({ username: '', password: '', nombre: '', role: 'admin' })
        loadUsers()
      } else {
        const data = await res.json()
        alert(data.message || 'Error al crear usuario')
      }
    } catch (error) {
      console.error('Error creando usuario:', error)
      alert('Error de conexión')
    }
  }

  async function handleDeleteUser(userId: number) {
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return

    try {
      const res = await fetch(`/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      })

      if (res.ok) {
        loadUsers()
      }
    } catch (error) {
      console.error('Error eliminando usuario:', error)
    }
  }

  async function handleLoginAs(userId: number, userName: string) {
    if (!confirm(`¿Iniciar sesión como ${userName}?`)) return

    try {
      const res = await fetch('/api/auth/login-as', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ userId })
      })

      if (res.ok) {
        const userData = await res.json()
        
        // Guardar sesión actual del SuperAdmin para restaurar después
        const superAdminSession = {
          token: currentUser.token,
          sessionId: currentUser.sessionId || localStorage.getItem('sessionId'),
          user: currentUser
        }
        sessionStorage.setItem('superAdminSession', JSON.stringify(superAdminSession))
        
        // Guardar nueva sesión temporalmente
        sessionStorage.setItem('token', userData.token)
        sessionStorage.setItem('sessionId', userData.sessionId)
        sessionStorage.setItem('isImpersonating', 'true')
        
        // Limpiar sesión del SuperAdmin del storage normal
        localStorage.removeItem('token')
        localStorage.removeItem('sessionId')
        
        // Recargar página para activar nueva sesión
        window.location.reload()
      } else {
        const data = await res.json()
        alert(data.message || 'Error al iniciar sesión')
      }
    } catch (error) {
      console.error('Error iniciando sesión como usuario:', error)
      alert('Error de conexión')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      {/* Botón de menú flotante */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.95) 0%, rgba(109, 40, 217, 0.95) 100%)',
          border: 'none',
          borderRadius: 12,
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '1.5em',
          color: 'white',
          transition: 'all 0.3s',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}
      >
        ☰
      </button>

      {/* Header (se muestra/oculta con el menú) */}
      {showMenu && (
        <div style={{
          background: 'var(--glass)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ color: 'var(--text)', margin: 0, fontSize: '24px' }}>
              🔐 Panel SuperAdmin
            </h1>
            <p style={{ color: 'var(--text-secondary)', margin: '5px 0 0 0', fontSize: '14px' }}>
              Gestión de usuarios del sistema
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={onToggleTheme}
              style={{
                background: 'var(--glass)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '20px'
              }}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button
              onClick={onLogout}
              style={{
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              🚪 Salir
            </button>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setShowNewUser(true)}
          style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            border: 'none',
            borderRadius: '10px',
            padding: '14px 24px',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
          }}
        >
          ➕ Crear Usuario
        </button>
        
        <button
          onClick={() => {
            setShowSolicitudes(true)
            loadPendingRequests()
          }}
          style={{
            background: pendingRequestsCount > 0 
              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.2) 100%)',
            border: pendingRequestsCount > 0 ? 'none' : '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '10px',
            padding: '14px 24px',
            cursor: 'pointer',
            color: pendingRequestsCount > 0 ? '#fff' : '#fbbf24',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: pendingRequestsCount > 0 ? '0 4px 12px rgba(245, 158, 11, 0.4)' : 'none',
            position: 'relative'
          }}
        >
          📋 Solicitudes de Cobradores
          {pendingRequestsCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              background: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)'
            }}>
              {pendingRequestsCount}
            </span>
          )}
        </button>
      </div>

      {/* Lista de Usuarios */}
      <div style={{
        background: 'var(--glass)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        padding: '20px'
      }}>
        <h2 style={{ color: 'var(--text)', marginTop: 0 }}>Usuarios del Sistema</h2>
        
        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {users.map(user => (
              <div
                key={user.id}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: user.role === 'admin' ? 'pointer' : 'default',
                  transition: 'all 0.3s'
                }}
                onClick={() => user.role === 'admin' && setSelectedAdminId(user.id)}
                onMouseEnter={(e) => {
                  if (user.role === 'admin') {
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (user.role === 'admin') {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                <div>
                  <div style={{ color: 'var(--text)', fontWeight: '600', fontSize: '16px' }}>
                    {user.nombre}
                    {user.role === 'admin' && (
                      <span style={{ 
                        marginLeft: '8px', 
                        fontSize: '0.85em', 
                        opacity: 0.6,
                        fontWeight: 400
                      }}>
                        (Click para ver detalles)
                      </span>
                    )}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                    @{user.username} • {user.role === 'superadmin' ? '🔐 SuperAdmin' : user.role === 'admin' ? '👤 Admin' : '🚶 Cobrador'}
                  </div>
                </div>
                {user.role !== 'superadmin' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleLoginAs(user.id, user.nombre)
                      }}
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        color: '#3b82f6',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      👤 Entrar como
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteUser(user.id)
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        borderRadius: '6px',
                        padding: '8px 16px',
                        cursor: 'pointer',
                        color: '#ef4444',
                        fontSize: '14px'
                      }}
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Crear Usuario */}
      {showNewUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2 style={{ color: 'var(--text)', marginTop: 0 }}>Crear Nuevo Usuario</h2>
            
            <form onSubmit={handleCreateUser}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: 'var(--text)', marginBottom: '8px', fontSize: '14px' }}>
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={newUser.nombre}
                  onChange={(e) => setNewUser({ ...newUser, nombre: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: 'var(--text)', marginBottom: '8px', fontSize: '14px' }}>
                  Usuario
                </label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', color: 'var(--text)', marginBottom: '8px', fontSize: '14px' }}>
                  Contraseña
                </label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text)',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', color: 'var(--text)', marginBottom: '8px', fontSize: '14px' }}>
                  Rol
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'cobrador' })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text)',
                    fontSize: '14px'
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="cobrador">Cobrador</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '600'
                  }}
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewUser(false)}
                  style={{
                    flex: 1,
                    background: 'var(--glass)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px',
                    cursor: 'pointer',
                    color: 'var(--text)',
                    fontSize: '14px'
                  }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalles del Admin */}
      {selectedAdminId && (
        <AdminDetailsModal
          adminId={selectedAdminId}
          token={currentUser.token}
          onClose={() => setSelectedAdminId(null)}
        />
      )}

      {/* Modal Solicitudes de Cobradores */}
      {showSolicitudes && (
        <SolicitudesCobradoresModal
          token={currentUser.token}
          onClose={() => {
            setShowSolicitudes(false)
            loadPendingRequests()
            loadUsers()
          }}
        />
      )}
    </div>
  )
}
