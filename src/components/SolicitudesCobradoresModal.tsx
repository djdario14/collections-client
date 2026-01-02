import React, { useState, useEffect } from 'react'

type Request = {
  id: number
  adminId: number
  adminNombre: string
  adminUsername: string
  username: string
  nombre: string
  status: 'pending' | 'approved' | 'rejected'
  requestType: 'create' | 'delete'
  cobradorId?: number
  createdAt: string
  resolvedAt?: string
}

type Props = {
  onClose: () => void
  token: string
}

export default function SolicitudesCobradoresModal({ onClose, token }: Props) {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')
  const [typeFilter, setTypeFilter] = useState<'all' | 'create' | 'delete'>('all')

  useEffect(() => {
    loadRequests()
  }, [])

  async function loadRequests() {
    try {
      const res = await fetch(`${API_URL}/auth/cobrador-requests`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error cargando solicitudes:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleResolve(requestId: number, action: 'approve' | 'reject') {
    const confirmMessage = action === 'approve' 
      ? '¿Aprobar la creación de este cobrador?' 
      : '¿Rechazar esta solicitud?'
    
    if (!confirm(confirmMessage)) return

    try {
      const res = await fetch(`${API_URL}/auth/cobrador-requests/${requestId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action })
      })

      if (res.ok) {
        loadRequests()
        const message = action === 'approve' 
          ? '✅ Cobrador creado exitosamente' 
          : '❌ Solicitud rechazada'
        alert(message)
      } else {
        const data = await res.json()
        alert(data.message || 'Error al procesar solicitud')
      }
    } catch (error) {
      console.error('Error procesando solicitud:', error)
      alert('Error de conexión')
    }
  }

  const filteredRequests = requests.filter(r => {
    // Filtrar por estado
    if (filter !== 'all' && r.status !== filter) return false
    // Filtrar por tipo
    if (typeFilter !== 'all' && r.requestType !== typeFilter) return false
    return true
  })

  const pendingCount = requests.filter(r => r.status === 'pending').length
  const createCount = requests.filter(r => r.requestType === 'create').length
  const deleteCount = requests.filter(r => r.requestType === 'delete').length

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 16, 33, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,40,55,0.95) 0%, rgba(20,30,45,0.95) 100%)',
        padding: '32px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '85vh',
        overflow: 'auto',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: '#e6eef6', margin: 0, fontSize: '1.5em' }}>
              📋 Solicitudes de Cobradores
            </h2>
            {pendingCount > 0 && (
              <span style={{
                display: 'inline-block',
                marginTop: '8px',
                background: 'rgba(245, 158, 11, 0.2)',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                padding: '4px 12px',
                color: '#fbbf24',
                fontSize: '0.85em',
                fontWeight: 600
              }}>
                {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#e6eef6',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>

        {/* Filtro por tipo */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '16px',
          flexWrap: 'wrap',
          borderBottom: '2px solid rgba(100, 200, 255, 0.2)',
          paddingBottom: '12px'
        }}>
          {(['all', 'create', 'delete'] as const).map((t) => {
            const labels = {
              all: '📋 Todas',
              create: '➕ Creaciones',
              delete: '🗑️ Eliminaciones'
            }
            const count = t === 'all' ? requests.length : (t === 'create' ? createCount : deleteCount)
            
            return (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  border: typeFilter === t ? '2px solid #60a5fa' : '1px solid rgba(100, 200, 255, 0.3)',
                  background: typeFilter === t ? 'rgba(96, 165, 250, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  color: typeFilter === t ? '#60a5fa' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: typeFilter === t ? '600' : '400',
                  transition: 'all 0.3s'
                }}
              >
                {labels[t]} ({count})
              </button>
            )
          })}
        </div>

        {/* Filtros por estado */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => {
            const labels = {
              all: '📊 Todas',
              pending: '⏳ Pendientes',
              approved: '✅ Aprobadas',
              rejected: '❌ Rechazadas'
            }
            const count = f === 'all' ? requests.length : requests.filter(r => r.status === f).length
            
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  border: filter === f ? '2px solid #fbbf24' : '1px solid rgba(100, 200, 255, 0.3)',
                  background: filter === f ? 'rgba(245, 158, 11, 0.2)' : 'rgba(15, 23, 42, 0.5)',
                  color: filter === f ? '#fbbf24' : '#94a3b8',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: filter === f ? '600' : '400',
                  transition: 'all 0.3s'
                }}
              >
                {labels[f]} ({count})
              </button>
            )
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Cargando solicitudes...
          </div>
        ) : filteredRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '3em', marginBottom: '16px' }}>📭</div>
            <p style={{ color: '#94a3b8', fontSize: '1.1em', marginBottom: '8px' }}>
              {filter === 'pending' 
                ? 'No hay solicitudes pendientes' 
                : `No hay solicitudes ${filter === 'all' ? '' : filter === 'approved' ? 'aprobadas' : 'rechazadas'}`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredRequests.map((request) => (
              <div 
                key={request.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: `1px solid ${
                    request.status === 'pending' ? 'rgba(245, 158, 11, 0.4)' :
                    request.status === 'approved' ? 'rgba(34, 197, 94, 0.4)' :
                    'rgba(239, 68, 68, 0.4)'
                  }`,
                  borderRadius: '12px',
                  padding: '20px',
                  position: 'relative'
                }}
              >
                {/* Badge de estado */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: request.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' :
                             request.status === 'approved' ? 'rgba(34, 197, 94, 0.2)' :
                             'rgba(239, 68, 68, 0.2)',
                  border: `1px solid ${
                    request.status === 'pending' ? 'rgba(245, 158, 11, 0.5)' :
                    request.status === 'approved' ? 'rgba(34, 197, 94, 0.5)' :
                    'rgba(239, 68, 68, 0.5)'
                  }`,
                  borderRadius: '12px',
                  padding: '4px 12px',
                  fontSize: '0.8em',
                  fontWeight: 600,
                  color: request.status === 'pending' ? '#fbbf24' :
                         request.status === 'approved' ? '#4ade80' :
                         '#fca5a5'
                }}>
                  {request.status === 'pending' ? '⏳ Pendiente' :
                   request.status === 'approved' ? '✅ Aprobada' :
                   '❌ Rechazada'}
                </div>

                <div style={{ marginBottom: '16px', paddingRight: '120px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <h3 style={{ 
                      color: '#e6eef6', 
                      margin: 0,
                      fontSize: '1.2em',
                      fontWeight: 600
                    }}>
                      {request.nombre}
                    </h3>
                    <span style={{
                      background: request.requestType === 'create' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      border: `1px solid ${request.requestType === 'create' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'}`,
                      borderRadius: '8px',
                      padding: '2px 8px',
                      fontSize: '0.7em',
                      fontWeight: 600,
                      color: request.requestType === 'create' ? '#4ade80' : '#fca5a5'
                    }}>
                      {request.requestType === 'create' ? '➕ Crear' : '🗑️ Eliminar'}
                    </span>
                  </div>
                  <p style={{ 
                    color: '#94a3b8', 
                    margin: 0,
                    fontSize: '0.95em'
                  }}>
                    Usuario: <strong style={{ color: '#60a5fa' }}>@{request.username}</strong>
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '12px',
                  marginBottom: '16px',
                  padding: '12px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '8px'
                }}>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.8em', marginBottom: '4px' }}>
                      Solicitado por
                    </div>
                    <div style={{ color: '#e6eef6', fontWeight: 600 }}>
                      {request.adminNombre}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '0.85em' }}>
                      @{request.adminUsername}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: '0.8em', marginBottom: '4px' }}>
                      Fecha de solicitud
                    </div>
                    <div style={{ color: '#e6eef6' }}>
                      {new Date(request.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {request.resolvedAt && (
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.8em', marginBottom: '4px' }}>
                        Fecha de resolución
                      </div>
                      <div style={{ color: '#e6eef6' }}>
                        {new Date(request.resolvedAt).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>

                {request.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleResolve(request.id, 'approve')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(34, 197, 94, 0.4)',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      ✓ {request.requestType === 'create' ? 'Crear Cobrador' : 'Eliminar Cobrador'}
                    </button>
                    <button
                      onClick={() => handleResolve(request.id, 'reject')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '8px',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        background: 'rgba(239, 68, 68, 0.2)',
                        color: '#fca5a5',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                      }}
                    >
                      ✕ Rechazar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
