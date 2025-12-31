import React, { useState, useEffect } from 'react'
import CobradorRutaModal from './CobradorRutaModal'
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
  const [selectedCobrador, setSelectedCobrador] = useState<Cobrador | null>(null)

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
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onClick={() => setSelectedCobrador(cobrador)}
                title="Ver detalles de la ruta"
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
                  onClick={e => { e.stopPropagation(); handleRequestDelete(cobrador.id, cobrador.nombre); }}
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
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
                >
                  🗑️ Solicitar Eliminación
                </button>
              </div>
            ))}
            {cobradores.length === 0 && (
              <>
                <p style={{ color: '#94a3b8', fontSize: '1.1em', marginBottom: '8px' }}>
                  No tienes cobradores registrados
                </p>
                <p style={{ color: '#64748b', fontSize: '0.9em' }}>
                  Crea tu primer cobrador para comenzar a delegar rutas
                </p>
              </>
            )}
          {/* Modal de detalles de ruta del cobrador */}
          {selectedCobrador && (
            <CobradorRutaModal cobrador={selectedCobrador} onClose={() => setSelectedCobrador(null)} />
          )}
      </div>
  )
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
