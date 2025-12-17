import React, { useEffect, useState } from 'react'
import CobroModal from './CobroModal'
import NewClientModal from './NewClientModal'
import CreditModal from './CreditModal'
import ClientDetail from './ClientDetail'
import ResumenModal from './ResumenModal'
import GastoModal from './GastoModal'
import SyncIndicator from './SyncIndicator'
import EnrutarModal from './EnrutarModal'
import GestionCobradoresModal from './GestionCobradoresModal'
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

type DashboardProps = {
  theme: 'dark' | 'light'
  onToggleTheme: () => void
  user: {
    id: number
    username: string
    nombre: string
    role: 'superadmin' | 'admin' | 'cobrador'
    adminId: number | null
    token: string
    sessionId: string
  }
  onLogout: () => void
}

export default function Dashboard({ theme, onToggleTheme, user, onLogout }: DashboardProps) {
  const [clients, setClients] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [showCobro, setShowCobro] = useState(false)
  const [showNewClient, setShowNewClient] = useState(false)
  const [showCredit, setShowCredit] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showResumen, setShowResumen] = useState(false)
  const [showGasto, setShowGasto] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showEnrutar, setShowEnrutar] = useState(false)
  const [showCobradores, setShowCobradores] = useState(false)
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [gastosRefresh, setGastosRefresh] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [vistaActual, setVistaActual] = useState<'todos' | 'sin-abono' | 'con-abono'>('sin-abono')
  const [currentDay, setCurrentDay] = useState(new Date().toISOString().split('T')[0])
  const [rutaVersion, setRutaVersion] = useState(0)

  useEffect(() => {
    let mounted = true
    const loadClients = () => {
      getClients().then((list) => {
        if (!mounted) return
        setClients(list)
        setLoading(false)
        // Si hay un cliente seleccionado, actualízalo con la nueva data (si existe)
        if (selected) {
          const actualizado = list.find(c => c.id === selected.id)
          if (actualizado) {
            setSelected(actualizado)
          }
        }
      })
    }
    loadClients()
    // Auto-refresh cada 5 segundos
    const interval = setInterval(loadClients, 5000)
    return () => { 
      mounted = false
      clearInterval(interval)
    }
  }, [selected])

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

  function refresh() { getClients().then(setClients) }

  // Calcular estadísticas para el resumen (usar currentDay en lugar de recalcular)
  const today = currentDay
  const totalCobradoHoy = clients.reduce((sum, c) => {
    const pagosHoy = (c.payments || []).filter((p: any) => {
      const fechaPago = p.date.split('T')[0]
      return fechaPago === today
    })
    return sum + pagosHoy.reduce((s: number, p: any) => s + p.amount, 0)
  }, 0)
  
  const totalPrestado = clients.reduce((sum, c) => {
    const creditosHoy = (c.credits || []).filter((cr: any) => {
      const fechaCredito = cr.date.split('T')[0]
      return fechaCredito === today
    })
    return sum + creditosHoy.reduce((s: number, cr: any) => s + cr.total, 0)
  }, 0)
  
  const cantidadClientesConAbono = clients.filter(c => {
    return (c.payments || []).some((p: any) => {
      const fechaPago = p.date.split('T')[0]
      return fechaPago === today
    })
  }).length
  
  const clientesNuevosHoy = clients.filter(c => {
    return c.createdAt && c.createdAt.startsWith(today)
  }).length

  // Calcular gastos del día desde localStorage
  const gastosDelDia = React.useMemo(() => {
    const gastos = JSON.parse(localStorage.getItem('gastos') || '[]')
    return gastos
      .filter((g: any) => g.fecha === today)
      .reduce((sum: number, g: any) => sum + g.monto, 0)
  }, [today, gastosRefresh])
  
  // Forzar re-render cuando se añade un gasto
  const refreshGastos = () => setGastosRefresh(prev => prev + 1)

  // Calcular quién pagó hoy
  const clientesConAbonoHoy = React.useMemo(() => {
    return new Set(
      clients.filter(c => {
        const pagosHoy = (c.payments || []).filter((p: any) => {
          const fechaPago = p.date.split('T')[0]
          return fechaPago === today
        })
        return pagosHoy.length > 0
      }).map(c => c.id)
    )
  }, [clients, today])

  // Filtrar clientes por búsqueda y vista
  const filteredClients = React.useMemo(() => {
    let lista = clients
    
    // Filtrar por vista actual
    if (vistaActual === 'sin-abono') {
      // Pendientes: solo clientes con deuda > 0 y que no han abonado hoy
      lista = lista.filter(c => c.deuda > 0 && !clientesConAbonoHoy.has(c.id))
    } else if (vistaActual === 'con-abono') {
      lista = lista.filter(c => clientesConAbonoHoy.has(c.id))
    }
    
    // Filtrar por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      lista = lista.filter(c => 
        c.nombre.toLowerCase().includes(term) || 
        c.id.toString().includes(term)
      )
    }
    
    // Aplicar orden de ruta si existe
    const rutaGuardada = localStorage.getItem('rutaClientes')
    if (rutaGuardada && vistaActual === 'sin-abono') {
      try {
        const ruta = JSON.parse(rutaGuardada)
        const ordenMap = new Map(ruta.map((r: any) => [r.clienteId, r.orden]))
        
        lista.sort((a, b) => {
          const ordenA = ordenMap.get(a.id) || 9999
          const ordenB = ordenMap.get(b.id) || 9999
          return ordenA - ordenB
        })
      } catch (e) {
        console.error('Error al aplicar orden de ruta:', e)
      }
    }
    
    return lista
  }, [clients, searchTerm, vistaActual, clientesConAbonoHoy, rutaVersion])

  return (
    <div className="dashboard">
      <div className="dash-header" style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg)',
        zIndex: 50,
        paddingTop: 12,
        paddingBottom: 12,
        marginBottom: 12
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            style={{
              background: 'var(--glass)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '10px 12px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              transition: 'all 0.3s'
            }}
            title="Menú"
          >
            <div style={{ width: 20, height: 2, background: 'var(--text)', borderRadius: 2 }}></div>
            <div style={{ width: 20, height: 2, background: 'var(--text)', borderRadius: 2 }}></div>
            <div style={{ width: 20, height: 2, background: 'var(--text)', borderRadius: 2 }}></div>
          </button>
          
          <div style={{ 
            flex: 1, 
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'var(--glass)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '0 14px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
            transition: 'all 0.3s'
          }}>
            <span style={{ fontSize: '1.1em', marginRight: 10, opacity: 0.6 }}>🔍</span>
            <input 
              placeholder="Buscar cliente" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                padding: '11px 0',
                fontSize: '0.95em',
                color: 'var(--text)'
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2em',
                  opacity: 0.5,
                  padding: '0 4px',
                  color: 'var(--text)'
                }}
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
          <SyncIndicator />
        </div>
        <div className="header-actions">
          <button className="primary" onClick={() => setShowNewClient(true)} style={{ fontSize: '1.2em', padding: '8px 12px' }} title="Nuevo cliente">+👤</button>
        </div>
      </div>

      {/* Menú lateral deslizante */}
      {showMenu && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 100
          }}
          onClick={() => setShowMenu(false)}
        >
          <div
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: 280,
              background: 'var(--card)',
              boxShadow: '4px 0 12px rgba(0,0,0,0.3)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              animation: 'slideIn 0.3s ease'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, color: 'var(--text)' }}>Menú</h3>
              <button
                onClick={() => setShowMenu(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5em',
                  cursor: 'pointer',
                  color: 'var(--text)'
                }}
              >
                ✕
              </button>
            </div>
            
            <button
              onClick={() => {
                setShowResumen(true)
                setShowMenu(false)
              }}
              style={{
                background: 'var(--glass)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '1em',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.3s'
              }}
            >
              <span style={{ fontSize: '1.5em' }}>📊</span>
              <span>Resumen de Cobranza</span>
            </button>
            
            <button
              onClick={() => {
                setShowGasto(true)
                setShowMenu(false)
              }}
              style={{
                background: 'var(--glass)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '1em',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.3s'
              }}
            >
              <span style={{ fontSize: '1.5em' }}>💸</span>
              <span>Registrar Gasto</span>
            </button>
            
            <button
              onClick={() => {
                onToggleTheme()
                setShowMenu(false)
              }}
              style={{
                background: 'var(--glass)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '1em',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.3s'
              }}
            >
              <span style={{ fontSize: '1.5em' }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span>{theme === 'dark' ? 'Tema Claro' : 'Tema Oscuro'}</span>
            </button>
            
            <button
              onClick={() => {
                setShowEnrutar(true)
                setShowMenu(false)
              }}
              style={{
                background: 'var(--glass)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '16px',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '1em',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.3s'
              }}
            >
              <span style={{ fontSize: '1.5em' }}>🗺️</span>
              <span>Enrutar Clientes</span>
            </button>
            
            <button
              onClick={() => {
                setShowCobradores(true)
                setShowMenu(false)
              }}
              style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                borderRadius: 10,
                padding: '16px',
                cursor: 'pointer',
                color: 'var(--text)',
                fontSize: '1em',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.3s'
              }}
            >
              <span style={{ fontSize: '1.5em' }}>📋</span>
              <span>Ver Mis Rutas</span>
            </button>
            
            {/* Información del usuario */}
            <div style={{
              padding: '16px',
              borderTop: '1px solid var(--border)',
              marginTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{
                color: 'var(--text)',
                fontSize: '0.9em',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '1.5em' }}>👤</span>
                <div>
                  <div style={{ fontWeight: '600' }}>{user.nombre}</div>
                  <div style={{ fontSize: '0.85em', opacity: 0.7, textTransform: 'capitalize' }}>
                    {user.role === 'superadmin' ? 'Super Admin' : user.role}
                  </div>
                </div>
              </div>
              
              <button
                onClick={() => {
                  onLogout()
                  setShowMenu(false)
                }}
                style={{
                  background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.2) 100%)',
                  border: '1px solid rgba(239, 68, 68, 0.4)',
                  borderRadius: 10,
                  padding: '12px 16px',
                  cursor: 'pointer',
                  color: 'var(--text)',
                  fontSize: '0.95em',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  transition: 'all 0.3s',
                  fontWeight: '500'
                }}
              >
                <span style={{ fontSize: '1.2em' }}>🚪</span>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>

      <section className="list">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>Clientes</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              className={vistaActual === 'sin-abono' ? 'primary' : 'ghost'} 
              onClick={() => setVistaActual('sin-abono')}
            >
              Pendientes
            </button>
            <button 
              className={vistaActual === 'todos' ? 'primary' : 'ghost'} 
              onClick={() => setVistaActual('todos')}
            >
              Todos
            </button>
          </div>
        </div>
        {loading ? (
          <p>Cargando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Saldo</th>
                <th>Atraso</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((c) => {
                // Calcular días de atraso para clientes con saldo pendiente
                const tieneCreditos = c.credits && c.credits.length > 0
                let enMora = false
                let diasAtraso = 0
                
                if (tieneCreditos && c.deuda > 0) {
                  // Buscar el crédito activo más reciente (con saldo > 0)
                  const creditosOrdenados = [...c.credits].sort((a: any, b: any) => 
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                  )
                  
                  // Encontrar el primer crédito con saldo pendiente
                  for (const cr of creditosOrdenados) {
                    // Calcular saldo de este crédito
                    const pagosDelCredito = (c.payments || []).filter((p: any) => 
                      p.creditId === cr.id && p.amount > 0
                    )
                    const abonoTotal = pagosDelCredito.reduce((sum: number, p: any) => sum + p.amount, 0)
                    const saldo = cr.total - abonoTotal
                    
                    if (saldo > 0) {
                      // Este es el crédito activo - calcular desde aquí
                      const fechaCredito = new Date(cr.date)
                      fechaCredito.setHours(0, 0, 0, 0)
                      const hoy = new Date()
                      hoy.setHours(0, 0, 0, 0)
                      
                      const diasTranscurridos = Math.floor((hoy.getTime() - fechaCredito.getTime()) / (1000 * 60 * 60 * 24))
                      
                      // Calcular días de atraso basado en pagos realizados
                      const totalPagosRealizados = pagosDelCredito.length
                      diasAtraso = Math.max(0, diasTranscurridos - totalPagosRealizados)
                      
                      // Mora solo después de 30 días
                      if (diasTranscurridos > 30) {
                        enMora = true
                      }
                      
                      break // Solo considerar el crédito activo más reciente
                    }
                  }
                }
                
                return (
                <tr key={c.id} onClick={() => openDetail(c)} style={{ 
                  cursor: 'pointer',
                  background: enMora ? 'rgba(239,68,68,0.15)' : 'transparent',
                  borderLeft: enMora ? '4px solid #ef4444' : 'none'
                }}>
                  <td>{c.id}</td>
                  <td>
                    {c.nombre}
                    {enMora && <span style={{ marginLeft: 8, color: '#ef4444', fontSize: '0.85em', fontWeight: 700 }}>⚠️ MORA</span>}
                  </td>
                  <td className="debt">${c.deuda.toLocaleString()}</td>
                  <td>
                    {diasAtraso > 0 ? (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>{diasAtraso} días</span>
                    ) : c.deuda > 0 ? (
                      <span style={{ color: '#10b981' }}>Al día</span>
                    ) : (
                      <span style={{ color: '#6b7280' }}>-</span>
                    )}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {c.deuda > 0 ? (
                      <button className="primary small" onClick={() => openCobro(c)}>Abonar</button>
                    ) : (
                      <button className="primary small" onClick={() => { setSelected(c); setShowCredit(true); }}>Nuevo crédito</button>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </section>

      {showCobro && selected && (
        <CobroModal
          clientId={selected.id}
          clientName={selected.nombre}
          onClose={() => setShowCobro(false)}
          onPaymentCreated={() => { setShowCobro(false); refresh() }}
        />
      )}

      {showNewClient && (
        <NewClientModal onClose={() => setShowNewClient(false)} onClientCreated={(created) => {
          setShowNewClient(false);
          refresh();
          if (created) {
            setSelected(created as Cliente);
            setShowCredit(true);
          }
        }} />
      )}

      {showCredit && selected && (
        <CreditModal clientId={selected.id} clientName={selected.nombre} onClose={() => setShowCredit(false)} onCreditCreated={() => { setShowCredit(false); refresh() }} />
      )}

      {showDetail && selected && (
        <ClientDetail clientId={selected.id} onClose={() => setShowDetail(false)} theme={theme} />
      )}

      {showResumen && (
        <ResumenModal 
          onClose={() => setShowResumen(false)}
          totalCobrado={totalCobradoHoy}
          totalPrestado={totalPrestado}
          clientesConAbono={cantidadClientesConAbono}
          totalClientes={clients.length}
          clientesNuevos={clientesNuevosHoy}
          gastosDelDia={gastosDelDia}
        />
      )}

      {showGasto && (
        <GastoModal 
          onClose={() => setShowGasto(false)}
          onGastoCreated={() => {
            setShowGasto(false)
            refreshGastos()
          }}
        />
      )}

      {showEnrutar && (
        <EnrutarModal 
          onClose={() => setShowEnrutar(false)} 
          onRutaGuardada={() => setRutaVersion(v => v + 1)}
        />
      )}

      {showCobradores && (
        <GestionCobradoresModal 
          onClose={() => setShowCobradores(false)}
        />
      )}
    </div>
  )
}
