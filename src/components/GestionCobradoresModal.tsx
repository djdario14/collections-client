import React, { useState, useEffect } from 'react'

type Ruta = {
  nombre: string
  clientes: Cliente[]
}

type Cliente = {
  id: string
  nombre: string
  telefono: string
  deuda: number
  negocio?: string
  orden?: number
}

type Props = {
  onClose: () => void
}

export default function GestionCobradoresModal({ onClose }: Props) {
  const [rutas, setRutas] = useState<Ruta[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRuta, setSelectedRuta] = useState<string | null>(null)

  useEffect(() => {
    loadRutas()
  }, [])

  async function loadRutas() {
    try {
      // Cargar clientes de la API
      const res = await fetch('/api/clients')
      const clientes: Cliente[] = await res.json()

      // Obtener rutas guardadas del localStorage
      const savedRutas = localStorage.getItem('rutasGuardadas')
      
      if (savedRutas) {
        const rutasData: { [key: string]: string[] } = JSON.parse(savedRutas)
        
        // Organizar clientes por ruta
        const rutasOrganizadas: Ruta[] = Object.entries(rutasData).map(([nombreRuta, clientIds]) => ({
          nombre: nombreRuta,
          clientes: clientIds
            .map(id => clientes.find(c => c.id === id))
            .filter(Boolean) as Cliente[]
        }))

        setRutas(rutasOrganizadas)
      } else {
        // Si no hay rutas guardadas, crear una ruta por defecto con todos los clientes con deuda
        const clientesConDeuda = clientes
          .filter(c => c.deuda > 0)
          .sort((a, b) => (a.orden || 999) - (b.orden || 999))

        setRutas([{
          nombre: 'Ruta Principal',
          clientes: clientesConDeuda
        }])
      }

      setLoading(false)
    } catch (error) {
      console.error('Error cargando rutas:', error)
      setLoading(false)
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
        padding: '24px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid rgba(100,200,255,0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#e6eef6', margin: 0 }}>📋 Mis Rutas de Cobranza</h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#e6eef6'
          }}>✕</button>
        </div>

        {loading ? (
          <p style={{ color: '#94a3b8', textAlign: 'center', padding: '40px' }}>Cargando rutas...</p>
        ) : rutas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: '#94a3b8', fontSize: '1.1em', marginBottom: '16px' }}>
              No hay rutas configuradas
            </p>
            <p style={{ color: '#64748b', fontSize: '0.9em' }}>
              Usa "Enrutar Clientes" del menú para organizar tu ruta
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {rutas.map((ruta, idx) => (
              <div key={idx} style={{
                background: 'rgba(15,23,42,0.5)',
                borderRadius: '12px',
                padding: '16px',
                border: '1px solid rgba(100,200,255,0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                  paddingBottom: '12px',
                  borderBottom: '1px solid rgba(100,200,255,0.2)'
                }}>
                  <h3 style={{ color: '#e6eef6', margin: 0, fontSize: '1.2em' }}>
                    🗺️ {ruta.nombre}
                  </h3>
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    color: '#60a5fa',
                    fontSize: '0.9em',
                    fontWeight: '600'
                  }}>
                    {ruta.clientes.length} clientes
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ruta.clientes.length === 0 ? (
                    <p style={{ color: '#94a3b8', fontSize: '0.9em', margin: '8px', textAlign: 'center' }}>
                      No hay clientes en esta ruta
                    </p>
                  ) : (
                    ruta.clientes.map((cliente, clienteIdx) => (
                      <div
                        key={cliente.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          borderRadius: '8px',
                          background: 'rgba(30,40,55,0.5)',
                          border: '1px solid rgba(100,200,255,0.1)',
                          transition: 'all 0.3s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '0.85em',
                            fontWeight: '600'
                          }}>
                            {clienteIdx + 1}
                          </span>
                          <div>
                            <div style={{ color: '#e6eef6', fontWeight: '600', marginBottom: '2px' }}>
                              {cliente.nombre}
                            </div>
                            <div style={{ color: '#94a3b8', fontSize: '0.85em' }}>
                              {cliente.negocio || cliente.telefono || 'Sin información'}
                            </div>
                          </div>
                        </div>
                        <div style={{
                          color: cliente.deuda > 0 ? '#fca5a5' : '#86efac',
                          fontWeight: '600',
                          fontSize: '1.1em'
                        }}>
                          ${(Number(cliente.deuda) || 0).toFixed(2)}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {ruta.clientes.length > 0 && (
                  <div style={{
                    marginTop: '16px',
                    paddingTop: '16px',
                    borderTop: '1px solid rgba(100,200,255,0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.9em' }}>
                      Total a cobrar:
                    </span>
                    <span style={{
                      color: '#fca5a5',
                      fontSize: '1.3em',
                      fontWeight: '700'
                    }}>
                      ${ruta.clientes.reduce((sum, c) => sum + (Number(c.deuda) || 0), 0).toFixed(2)}
                    </span>
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
