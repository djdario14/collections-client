import React, { useEffect, useState } from 'react'
import CobroModal from './CobroModal'
import NewClientModal from './NewClientModal'
import CreditModal from './CreditModal'
import GastoModal from './GastoModal'
import ClientDetail from './ClientDetail'
import SyncIndicator from './SyncIndicator'
import { getClients } from '../services/api'

type Cliente = {
  id: string
  nombre: string
  deuda: number
  vencimiento: string
  payments?: any[]
  credits?: any[]
  createdAt?: string
}

type CobradorDashboardProps = {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  user: {
    id: number
    username: string
    nombre: string
    role: 'cobrador'
    adminId: number | null
    token: string
    sessionId: string
  }
  onLogout: () => void
}

export default function CobradorDashboard({ theme, onToggleTheme, user, onLogout }: CobradorDashboardProps) {
  const [clients, setClients] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCobro, setShowCobro] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)
  const [showCredit, setShowCredit] = useState(false)
  const [showGasto, setShowGasto] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [newlyCreatedClient, setNewlyCreatedClient] = useState<Cliente | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [vistaActual, setVistaActual] = useState<'todos' | 'sin-abono' | 'con-abono'>('sin-abono')
  const [currentDay, setCurrentDay] = useState(new Date().toISOString().split('T')[0])
  const [showResumen, setShowResumen] = useState(false)

  useEffect(() => {
    let mounted = true
    const loadClients = () => {
      getClients()
        .then((list) => {
          if (!mounted) return
          console.log('✅ Clientes cargados:', list.length)
          setClients(list)
          setLoading(false)
          setError(null) // Limpiar error si la carga es exitosa
        })
        .catch((error) => {
          if (!mounted) return
          console.error('❌ Error cargando clientes:', error)
          setError(error.message || 'Error al cargar clientes')
          // Asegurarse de que loading se desactive incluso si hay error
          setLoading(false)
          // Mantener lista vacía o la lista anterior
        })
    }
    
    loadClients()
    
    // Auto-refresh cada 5 segundos
    const interval = setInterval(loadClients, 5000)
    
    return () => { 
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // Detectar cambio de día y refrescar automáticamente
  useEffect(() => {
    const checkDayChange = setInterval(() => {
      const newDay = new Date().toISOString().split('T')[0]
      if (newDay !== currentDay) {
        console.log('🔄 Nuevo día detectado, refrescando datos...')
        setCurrentDay(newDay)
        refresh()
      }
    }, 60000) // Verificar cada minuto

    return () => clearInterval(checkDayChange)
  }, [currentDay])

  function openCobro(c: Cliente) {
    setSelected(c)
    setShowCobro(true)
  }

  function openDetail(c: Cliente) {
    setSelected(c)
    setShowDetail(true)
  }

  function refresh() {
    getClients()
      .then(list => {
        console.log('✅ Clientes actualizados:', list.length, 'clientes')
        setClients(list)
        setError(null) // Limpiar error si la actualización es exitosa
      })
      .catch(error => {
        console.error('❌ Error al cargar clientes:', error)
        setError(error.message || 'Error al actualizar clientes')
        // No hacer nada más, mantener la lista actual
      })
  }

  // Filtrar clientes según búsqueda
  const filteredClients = clients.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Aplicar filtros de vista
  const hoy = new Date().toISOString().split('T')[0]
  const displayClients = filteredClients.filter(c => {
    const tieneAbonoHoy = (c.payments || []).some((p: any) => p.date?.startsWith(hoy))
    if (vistaActual === 'sin-abono') return !tieneAbonoHoy
    if (vistaActual === 'con-abono') return tieneAbonoHoy
    return true
  })

  // Calcular estadísticas
  const cobrosHoy = clients.flatMap(c => c.payments || []).filter((p: any) => 
    p.date?.startsWith(hoy)
  )
  const totalCobrado = cobrosHoy.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  const clientesConAbono = clients.filter(c => 
    (c.payments || []).some((p: any) => p.date?.startsWith(hoy))
  ).length

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
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      position: 'relative'
    }}>
      {/* Barra superior con menú y búsqueda */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'var(--bg-primary)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12
      }}>
        {/* Botón de menú */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.95) 0%, rgba(22, 163, 74, 0.95) 100%)',
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
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
            flexShrink: 0
          }}
        >
          ☰
        </button>

        {/* Barra de búsqueda */}
        <input
          type="text"
          placeholder="Buscar cliente"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            padding: '12px 16px',
            fontSize: '1em',
            border: theme === 'light' ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            background: theme === 'light' ? '#ffffff' : 'rgba(30,40,55,0.6)',
            color: theme === 'light' ? '#0f172a' : '#fff'
          }}
        />
      </div>

      {/* Banner de error si existe */}
      {error && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.9) 0%, rgba(220, 38, 38, 0.9) 100%)',
          color: 'white',
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10
        }}>
          <span>⚠️ {error}</span>
          <button
            onClick={() => {
              setError(null)
              refresh()
            }}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: 6,
              padding: '6px 12px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.9em',
              fontWeight: 500
            }}
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Contenido principal */}
      <div style={{
        padding: '20px',
        maxWidth: '100%'
      }}>

        {/* Botón Nuevo Cliente */}
        <button
          onClick={() => setShowNewClient(true)}
          style={{
            width: '100%',
            maxWidth: '200px',
            margin: '0 auto 20px',
            display: 'block',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            border: 'none',
            borderRadius: 12,
            padding: '14px 24px',
            cursor: 'pointer',
            color: '#fff',
            fontSize: '1.1em',
            fontWeight: 600,
            boxShadow: '0 4px 12px rgba(34,197,94,0.3)'
          }}
        >
          + 👤
        </button>

        {/* Botones de filtro */}
        <div style={{
          display: 'flex',
          gap: 10,
          marginBottom: 20,
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setVistaActual('sin-abono')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: theme === 'light' ? '2px solid #22c55e' : 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.95em',
              fontWeight: 600,
              background: vistaActual === 'sin-abono' 
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.1)',
              color: vistaActual === 'sin-abono' ? '#fff' : theme === 'light' ? '#0f172a' : '#fff',
              transition: 'all 0.3s'
            }}
          >
            Pendientes
          </button>
          <button
            onClick={() => setVistaActual('todos')}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: theme === 'light' ? '2px solid #22c55e' : 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: '0.95em',
              fontWeight: 600,
              background: vistaActual === 'todos' 
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : theme === 'light' ? '#f1f5f9' : 'rgba(255,255,255,0.1)',
              color: vistaActual === 'todos' ? '#fff' : theme === 'light' ? '#0f172a' : '#fff',
              transition: 'all 0.3s'
            }}
          >
            Todos
          </button>
        </div>

        {/* Encabezado "Clientes" */}
        <h2 style={{
          color: theme === 'light' ? '#0f172a' : '#fff',
          fontSize: '1.3em',
          marginBottom: 15,
          fontWeight: 600
        }}>
          Clientes
        </h2>

        {/* Tabla de clientes */}
        <div style={{
          background: theme === 'light' ? '#ffffff' : 'rgba(30,40,55,0.8)',
          borderRadius: 12,
          overflow: 'hidden',
          border: theme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: theme === 'light' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
        }}>
          {/* Encabezados */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 10,
            padding: '12px 16px',
            background: theme === 'light' ? '#f8fafc' : 'rgba(255,255,255,0.05)',
            borderBottom: theme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
            fontSize: '0.85em',
            color: theme === 'light' ? '#475569' : 'rgba(255,255,255,0.7)',
            fontWeight: 600
          }}>
            <div>Cliente</div>
            <div style={{ textAlign: 'center' }}>Saldo</div>
            <div style={{ textAlign: 'center' }}>Atraso</div>
            <div style={{ textAlign: 'center' }}>Acción</div>
          </div>

          {/* Lista de clientes */}
          {displayClients.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 40,
              color: theme === 'light' ? '#64748b' : 'rgba(255,255,255,0.5)'
            }}>
              No hay clientes
            </div>
          ) : (
            displayClients.map((c) => {
              const tieneAbonoHoy = (c.payments || []).some((p: any) => 
                p.date?.startsWith(hoy)
              )
              
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr',
                    gap: 10,
                    padding: '14px 16px',
                    borderBottom: theme === 'light' ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.05)',
                    alignItems: 'center',
                    background: tieneAbonoHoy ? (theme === 'light' ? '#d1fae5' : 'rgba(34,197,94,0.1)') : 'transparent',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onClick={() => openDetail(c)}
                >
                  <div>
                    <div style={{
                      fontSize: '0.95em',
                      fontWeight: 600,
                      color: theme === 'light' ? '#0f172a' : '#fff',
                      marginBottom: 2
                    }}>
                      {c.nombre}
                    </div>
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: '0.9em',
                    color: '#22c55e',
                    fontWeight: 600
                  }}>
                    ${(Number(c.deuda) || 0).toFixed(2)}
                  </div>
                  <div style={{
                    textAlign: 'center',
                    fontSize: '0.85em',
                    color: theme === 'light' ? '#64748b' : 'rgba(255,255,255,0.6)'
                  }}>
                    -
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openCobro(c)
                      }}
                      style={{
                        padding: '6px 12px',
                        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                        border: 'none',
                        borderRadius: 6,
                        color: '#fff',
                        fontSize: '0.8em',
                        cursor: 'pointer',
                        fontWeight: 600
                      }}
                    >
                      💰
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Sidebar del menú */}
      {showMenu && (
        <>
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1001
            }}
            onClick={() => setShowMenu(false)}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '280px',
            height: '100vh',
            background: 'rgba(30,40,55,0.98)',
            zIndex: 1002,
            padding: 20,
            boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            overflowY: 'auto',
            transform: 'translateX(0)',
            transition: 'transform 0.3s ease'
          }}>
            <button
              onClick={() => setShowMenu(false)}
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '1.5em',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>

            <div style={{ marginTop: 40 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 30,
                paddingBottom: 20,
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <div style={{
                  width: 50,
                  height: 50,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5em'
                }}>
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1em', color: '#fff' }}>{user.nombre}</div>
                  <div style={{ fontSize: '0.9em', color: 'rgba(255,255,255,0.6)' }}>Cobrador</div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowMenu(false)
                  setShowResumen(true)
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(59,130,246,0.2)',
                  border: '1px solid rgba(59,130,246,0.3)',
                  borderRadius: 8,
                  color: '#3b82f6',
                  fontSize: '1em',
                  cursor: 'pointer',
                  marginBottom: 12,
                  textAlign: 'left',
                  fontWeight: 600
                }}
              >
                📊 Resumen de Cobranza
              </button>

              <button
                onClick={() => {
                  setShowMenu(false)
                  alert('Función de enrutamiento en desarrollo')
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(168,85,247,0.2)',
                  border: '1px solid rgba(168,85,247,0.3)',
                  borderRadius: 8,
                  color: '#a855f7',
                  fontSize: '1em',
                  cursor: 'pointer',
                  marginBottom: 12,
                  textAlign: 'left',
                  fontWeight: 600
                }}
              >
                🗺️ Enrutar Clientes
              </button>

              <button
                onClick={() => {
                  setShowMenu(false)
                  setShowGasto(true)
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(251,146,60,0.2)',
                  border: '1px solid rgba(251,146,60,0.3)',
                  borderRadius: 8,
                  color: '#fb923c',
                  fontSize: '1em',
                  cursor: 'pointer',
                  marginBottom: 12,
                  textAlign: 'left',
                  fontWeight: 600
                }}
              >
                💸 Registrar Gasto
              </button>

              <button
                onClick={onToggleTheme}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: '1em',
                  cursor: 'pointer',
                  marginBottom: 12,
                  textAlign: 'left',
                  fontWeight: 600
                }}
              >
                {theme === 'dark' ? '☀️' : '🌙'} Cambiar tema
              </button>

              <button
                onClick={onLogout}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(239,68,68,0.2)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: 8,
                  color: '#ef4444',
                  fontSize: '1em',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600
                }}
              >
                🚪 Salir
              </button>
            </div>
          </div>
        </>
      )}

      <SyncIndicator />

      {/* Modal de Resumen */}
      {showResumen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1003,
          padding: 20
        }} onClick={() => setShowResumen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            maxWidth: 500,
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 24px 0', fontSize: '1.3em', color: '#000', fontWeight: 600 }}>
              Resumen de Cobranza
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Total cobrado del día */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ color: '#374151', fontSize: '1em' }}>Total cobrado del día:</span>
                <span style={{ color: '#000', fontSize: '1.1em', fontWeight: 700 }}>
                  ${clients.flatMap(c => c.payments || [])
                    .filter((p: any) => p.date?.startsWith(currentDay))
                    .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)}
                </span>
              </div>

              {/* Total prestado */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ color: '#374151', fontSize: '1em' }}>Total prestado:</span>
                <span style={{ color: '#000', fontSize: '1.1em', fontWeight: 700 }}>
                  ${clients.flatMap(c => c.credits || [])
                    .filter((cr: any) => cr.date?.startsWith(currentDay))
                    .reduce((sum: number, cr: any) => sum + (cr.amount || 0), 0)}
                </span>
              </div>

              {/* Gastos */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ color: '#374151', fontSize: '1em' }}>Gastos:</span>
                <span style={{ color: '#000', fontSize: '1.1em', fontWeight: 700 }}>
                  $0
                </span>
              </div>

              {/* Caja */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ color: '#374151', fontSize: '1em' }}>Caja:</span>
                <span style={{ color: '#22c55e', fontSize: '1.1em', fontWeight: 700 }}>
                  ${(
                    clients.flatMap(c => c.payments || [])
                      .filter((p: any) => p.date?.startsWith(currentDay))
                      .reduce((sum: number, p: any) => sum + (p.amount || 0), 0) -
                    clients.flatMap(c => c.credits || [])
                      .filter((cr: any) => cr.date?.startsWith(currentDay))
                      .reduce((sum: number, cr: any) => sum + (cr.amount || 0), 0)
                  )}
                </span>
              </div>

              {/* Clientes con abono */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <span style={{ color: '#374151', fontSize: '1em' }}>Clientes con abono:</span>
                <span style={{ color: '#000', fontSize: '1.1em', fontWeight: 700 }}>
                  {clients.filter(c => 
                    (c.payments || []).some((p: any) => p.date?.startsWith(currentDay))
                  ).length} de {clients.length}
                </span>
              </div>

              {/* Clientes nuevos del día */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 0'
              }}>
                <span style={{ color: '#374151', fontSize: '1em' }}>Clientes nuevos del día:</span>
                <span style={{ color: '#000', fontSize: '1.1em', fontWeight: 700 }}>
                  {clients.filter(c => c.createdAt?.startsWith(currentDay)).length}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowResumen(false)}
              style={{
                width: '100%',
                marginTop: 24,
                padding: '14px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                border: 'none',
                borderRadius: 8,
                color: '#fff',
                fontSize: '1em',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {showCobro && selected && (
        <CobroModal
          clientId={selected.id}
          clientName={selected.nombre}
          onClose={() => {
            setShowCobro(false)
            setSelected(null)
          }}
          onPaymentCreated={() => {
            setShowCobro(false)
            setSelected(null)
            refresh()
          }}
        />
      )}

      {showNewClient && (
        <NewClientModal
          onClose={() => setShowNewClient(false)}
          onClientCreated={(client) => {
            console.log('✅ Cliente creado, cerrando modal y refrescando lista')
            setShowNewClient(false)
            
            try {
              refresh()
              console.log('✅ Lista refrescada')
            } catch (error) {
              console.error('❌ Error al refrescar lista:', error)
            }
            
            // Preguntar si desea agregar un crédito
            if (client && client.id) {
              setTimeout(() => {
                try {
                  if (window.confirm(`✅ Cliente "${client.nombre}" creado exitosamente.\n\n¿Deseas registrar un crédito para este cliente ahora?`)) {
                    setNewlyCreatedClient(client)
                    setShowCredit(true)
                  }
                } catch (error) {
                  console.error('❌ Error mostrando confirmación de crédito:', error)
                }
              }, 300)
            }
          }}
        />
      )}

      {showCredit && newlyCreatedClient && (
        <CreditModal
          clientId={newlyCreatedClient.id}
          clientName={newlyCreatedClient.nombre}
          onClose={() => {
            setShowCredit(false)
            setNewlyCreatedClient(null)
          }}
          onCreditCreated={() => {
            setShowCredit(false)
            setNewlyCreatedClient(null)
            refresh()
          }}
        />
      )}

      {showGasto && (
        <GastoModal
          onClose={() => {
            setShowGasto(false)
            refresh()
          }}
        />
      )}

      {showDetail && selected && (
        <ClientDetail
          clientId={selected.id}
          onClose={() => {
            setShowDetail(false)
            setSelected(null)
            refresh()
          }}
          theme={theme}
        />
      )}
    </div>
  )
}

