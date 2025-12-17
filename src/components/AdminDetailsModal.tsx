import React, { useEffect, useState } from 'react'

type AdminDetails = {
  admin: {
    id: number
    username: string
    nombre: string
    createdAt: string
  }
  cobradores: Array<{
    id: number
    username: string
    nombre: string
    createdAt: string
    totalClientes: number
    clientes: Array<{
      id: string
      nombre: string
      deuda: number
      vencimiento: string | null
    }>
    cobrosHoy: {
      total: number
      cantidad: number
      clientesAtendidos: number
      detalle: Array<{
        amount: number
        date: string
        clienteNombre: string
      }>
    }
  }>
  resumen: {
    totalCobradores: number
    totalCobradoresActivos: number
    totalClientes: number
    totalCobradoHoy: number
  }
}

type Props = {
  adminId: number
  token: string
  onClose: () => void
}

export default function AdminDetailsModal({ adminId, token, onClose }: Props) {
  const [details, setDetails] = useState<AdminDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCobrador, setSelectedCobrador] = useState<number | null>(null)

  useEffect(() => {
    loadDetails()
  }, [adminId])

  async function loadDetails() {
    try {
      const res = await fetch(`/api/auth/admin/${adminId}/details`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setDetails(data)
      }
    } catch (error) {
      console.error('Error cargando detalles:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !details) {
    return (
      <>
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div style={{
            color: 'white',
            fontSize: '1.2em'
          }}>
            Cargando...
          </div>
        </div>
      </>
    )
  }

  const selectedCobradorData = selectedCobrador 
    ? details.cobradores.find(c => c.id === selectedCobrador)
    : null

  return (
    <>
      <div 
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          zIndex: 1000
        }}
      />
      
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'var(--glass)',
        backdropFilter: 'blur(20px)',
        borderRadius: 20,
        padding: 32,
        maxWidth: 1200,
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto',
        zIndex: 1001,
        border: '1px solid var(--border)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.3)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          paddingBottom: 16,
          borderBottom: '1px solid var(--border)'
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: '1.8em',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 12
            }}>
              <span>👤</span>
              {details.admin.nombre}
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              opacity: 0.7,
              fontSize: '0.95em'
            }}>
              @{details.admin.username} • Administrador
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: 10,
              width: 40,
              height: 40,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '1.2em',
              color: '#ef4444',
              transition: 'all 0.3s'
            }}
          >
            ✕
          </button>
        </div>

        {/* Resumen General */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 30
        }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(37, 99, 235, 0.15))',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2em', marginBottom: 8 }}>👥</div>
            <div style={{ fontSize: '1.8em', fontWeight: 700, color: '#3b82f6', marginBottom: 4 }}>
              {details.resumen.totalCobradores}
            </div>
            <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Cobradores</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.15))',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2em', marginBottom: 8 }}>💰</div>
            <div style={{ fontSize: '1.8em', fontWeight: 700, color: '#22c55e', marginBottom: 4 }}>
              ${details.resumen.totalCobradoHoy.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Cobrado Hoy</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(147, 51, 234, 0.15))',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2em', marginBottom: 8 }}>📋</div>
            <div style={{ fontSize: '1.8em', fontWeight: 700, color: '#a855f7', marginBottom: 4 }}>
              {details.resumen.totalClientes}
            </div>
            <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Clientes Total</div>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(249, 115, 22, 0.15))',
            border: '1px solid rgba(251, 146, 60, 0.3)',
            borderRadius: 12,
            padding: 20,
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2em', marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: '1.8em', fontWeight: 700, color: '#fb923c', marginBottom: 4 }}>
              {details.resumen.totalCobradoresActivos}
            </div>
            <div style={{ fontSize: '0.9em', opacity: 0.8 }}>Activos Hoy</div>
          </div>
        </div>

        {/* Lista de Cobradores */}
        <h3 style={{
          margin: '0 0 16px 0',
          fontSize: '1.4em',
          color: 'var(--text-primary)'
        }}>
          🎯 Cobradores
        </h3>

        <div style={{
          display: 'grid',
          gap: 12
        }}>
          {details.cobradores.map((cobrador) => (
            <div
              key={cobrador.id}
              style={{
                background: 'var(--glass)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 16,
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onClick={() => setSelectedCobrador(selectedCobrador === cobrador.id ? null : cobrador.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.borderColor = 'var(--border)'
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8
                  }}>
                    <span style={{ fontSize: '1.5em' }}>
                      {cobrador.cobrosHoy.cantidad > 0 ? '✅' : '⏳'}
                    </span>
                    <span style={{
                      fontSize: '1.1em',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}>
                      {cobrador.nombre}
                    </span>
                    <span style={{
                      fontSize: '0.9em',
                      opacity: 0.6
                    }}>
                      @{cobrador.username}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: 20,
                    fontSize: '0.9em',
                    opacity: 0.8
                  }}>
                    <span>📋 {cobrador.totalClientes} clientes</span>
                    <span>💰 ${cobrador.cobrosHoy.total.toLocaleString()}</span>
                    <span>✅ {cobrador.cobrosHoy.clientesAtendidos} atendidos</span>
                  </div>
                </div>
                <div style={{
                  fontSize: '1.2em',
                  color: 'var(--text-secondary)',
                  transition: 'transform 0.3s',
                  transform: selectedCobrador === cobrador.id ? 'rotate(180deg)' : 'rotate(0)'
                }}>
                  ▼
                </div>
              </div>

              {/* Detalles expandidos */}
              {selectedCobrador === cobrador.id && (
                <div style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: '1px solid var(--border)'
                }}>
                  {/* Clientes */}
                  {cobrador.clientes.length > 0 ? (
                    <>
                      <h4 style={{
                        margin: '0 0 12px 0',
                        fontSize: '1.1em',
                        color: 'var(--text-primary)'
                      }}>
                        📋 Clientes Asignados
                      </h4>
                      <div style={{
                        display: 'grid',
                        gap: 8,
                        marginBottom: 16
                      }}>
                        {cobrador.clientes.map((cliente) => {
                          const vencido = cliente.vencimiento && new Date(cliente.vencimiento) < new Date()
                          return (
                            <div
                              key={cliente.id}
                              style={{
                                background: vencido 
                                  ? 'rgba(239, 68, 68, 0.1)'
                                  : 'rgba(59, 130, 246, 0.05)',
                                border: vencido
                                  ? '1px solid rgba(239, 68, 68, 0.3)'
                                  : '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: 8,
                                padding: 12,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}
                            >
                              <div>
                                <div style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  marginBottom: 4
                                }}>
                                  {vencido && <span>⚠️</span>}
                                  <span style={{ fontWeight: 600 }}>{cliente.nombre}</span>
                                </div>
                                <div style={{ fontSize: '0.85em', opacity: 0.7 }}>
                                  {cliente.vencimiento && `Vence: ${new Date(cliente.vencimiento).toLocaleDateString()}`}
                                </div>
                              </div>
                              <div style={{
                                fontSize: '1.1em',
                                fontWeight: 700,
                                color: vencido ? '#ef4444' : '#3b82f6'
                              }}>
                                ${cliente.deuda.toLocaleString()}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  ) : (
                    <div style={{
                      textAlign: 'center',
                      padding: 20,
                      opacity: 0.6
                    }}>
                      Sin clientes asignados
                    </div>
                  )}

                  {/* Cobros de hoy */}
                  {cobrador.cobrosHoy.detalle.length > 0 && (
                    <>
                      <h4 style={{
                        margin: '0 0 12px 0',
                        fontSize: '1.1em',
                        color: 'var(--text-primary)'
                      }}>
                        💰 Cobros de Hoy
                      </h4>
                      <div style={{
                        display: 'grid',
                        gap: 8
                      }}>
                        {cobrador.cobrosHoy.detalle.map((cobro, idx) => (
                          <div
                            key={idx}
                            style={{
                              background: 'rgba(34, 197, 94, 0.1)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: 8,
                              padding: 12,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                                {cobro.clienteNombre}
                              </div>
                              <div style={{ fontSize: '0.85em', opacity: 0.7 }}>
                                {new Date(cobro.date).toLocaleTimeString()}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '1.1em',
                              fontWeight: 700,
                              color: '#22c55e'
                            }}>
                              ${cobro.amount.toLocaleString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {details.cobradores.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: 40,
            opacity: 0.6
          }}>
            <div style={{ fontSize: '3em', marginBottom: 16 }}>👥</div>
            <div style={{ fontSize: '1.1em' }}>
              Este administrador aún no tiene cobradores asignados
            </div>
          </div>
        )}
      </div>
    </>
  )
}
