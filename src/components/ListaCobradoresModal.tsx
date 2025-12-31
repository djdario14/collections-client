import React, { useState, useEffect } from 'react'
const API_BASE = import.meta.env.VITE_API_URL;

type Cobrador = {
  id: number
  username: string
  nombre: string
  role: 'cobrador'
  adminId: number | null
  createdAt: string
}

type Props = {
  onClose: () => void
  adminToken: string
  adminId: number
}

export default function ListaCobradoresModal({ onClose, adminToken, adminId }: Props) {
  const [cobradores, setCobradores] = useState<Cobrador[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCobradores()
  }, [])

  async function loadCobradores() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/${adminId}/cobradores`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      if (res.ok) {
        const cobradores = await res.json()
        setCobradores(cobradores)
      } else {
        console.error('Error al cargar cobradores:', res.status)
        alert('Error al cargar la lista de cobradores')
      }
    } catch (error) {
      console.error('Error cargando cobradores:', error)
      alert('Error de conexión al cargar cobradores')
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestDelete(cobradorId: number, nombre: string) {
    if (!confirm(`¿Solicitar eliminación del cobrador ${nombre}?\n\nEl SuperAdmin deberá aprobar esta solicitud.`)) return

    try {
      const res = await fetch('/api/auth/cobrador-delete-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ cobradorId })
      })

      if (res.ok) {
        alert('✅ Solicitud de eliminación enviada al SuperAdmin')
        onClose()
      } else {
        const data = await res.json()
        alert(data.message || 'Error al crear solicitud')
      }
    } catch (error) {
      console.error('Error solicitando eliminación:', error)
      alert('Error de conexión')
    }
  }

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
        maxWidth: '700px',
        maxHeight: '80vh',
        overflow: 'auto',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#e6eef6', margin: 0, fontSize: '1.5em' }}>
            👥 Mis Cobradores
          </h2>
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

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
            Cargando cobradores...
          </div>
        ) : cobradores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '3em', marginBottom: '16px' }}>👤</div>
            <p style={{ color: '#94a3b8', fontSize: '1.1em', marginBottom: '8px' }}>
              No tienes cobradores registrados
            </p>
            <p style={{ color: '#64748b', fontSize: '0.9em' }}>
              Crea tu primer cobrador para comenzar a delegar rutas
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {cobradores.map((cobrador) => (
              <div 
                key={cobrador.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.5em' }}>🎯</span>
                    <div>
                      <h3 style={{ 
                        color: '#e6eef6', 
                        margin: 0,
                        fontSize: '1.1em',
                        fontWeight: 600
                      }}>
                        {cobrador.nombre}
                      </h3>
                      <p style={{ 
                        color: '#94a3b8', 
                        margin: '4px 0 0 0',
                        fontSize: '0.9em'
                      }}>
                        @{cobrador.username}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '8px',
                    fontSize: '0.85em'
                  }}>
                    <span style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '12px',
                      padding: '4px 10px',
                      color: '#4ade80'
                    }}>
                      Cobrador Activo
                    </span>
                    <span style={{ color: '#64748b' }}>
                      Desde {new Date(cobrador.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRequestDelete(cobrador.id, cobrador.nombre)}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '8px',
                    padding: '10px 16px',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.3s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
                  }}
                >
                  🗑️ Solicitar Eliminación
                </button>
              </div>
            ))}
          </div>
        )}

        <div style={{
          marginTop: '24px',
          padding: '16px',
          borderRadius: '8px',
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
          <p style={{
            color: '#60a5fa',
            fontSize: '13px',
            margin: 0,
            lineHeight: 1.5
          }}>
            💡 <strong>Tip:</strong> Puedes asignar clientes específicos a cada cobrador desde "Enrutar Clientes" o los cobradores pueden ver todos los clientes activos.
          </p>
        </div>
      </div>
    </div>
  )
}
