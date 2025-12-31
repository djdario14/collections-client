
import React, { useEffect, useState } from 'react';
import ResumenModal from './ResumenModal';
import ClientDetail from './ClientDetail';
import CrearCobradorModal from './CrearCobradorModal';
import ListaCobradoresModal from './ListaCobradoresModal';
import EnrutarModal from './EnrutarModal';
import SyncIndicator from './SyncIndicator';
import { getClients } from '../services/api';

// ...existing code...

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

  function openDetail(c: Cliente) {
    setSelected(c)
    setShowDetail(true)
  }

  function refresh() {
    getClients().then(setClients)
    setGastosRefresh((prev) => prev + 1)
  }

  // Calcular estadísticas de cobranza del día
  const hoy = new Date().toISOString().split('T')[0]
  const cobrosHoy = clients.flatMap(c => c.payments || []).filter((p: any) => 
    p.date?.startsWith(hoy)
  )
  const totalCobrado = cobrosHoy.reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
  const clientesConAbono = clients.filter(c => 
    (c.payments || []).some((p: any) => p.date?.startsWith(hoy))
  ).length

  // Clasificar cartera
  const filteredClients = clients.filter(c => 
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const clientesPorCategoria = filteredClients.filter(c => {
    const tieneDeuda = c.deuda > 0
    const vencido = c.vencimiento && new Date(c.vencimiento) < new Date()
    
    if (vistaCartera === 'vencidos') return vencido && tieneDeuda
    if (vistaCartera === 'al-dia') return !vencido && tieneDeuda
    if (vistaCartera === 'activos') return tieneDeuda
    return true
  })

  // Ordenar por deuda (mayor a menor)
  const clientesOrdenados = [...clientesPorCategoria].sort((a, b) => b.deuda - a.deuda)

  const totalDeuda = clients.reduce((sum, c) => sum + c.deuda, 0)
  const clientesVencidos = clients.filter(c => c.vencimiento && new Date(c.vencimiento) < new Date() && c.deuda > 0).length

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

  const isImpersonating = sessionStorage.getItem('isImpersonating') === 'true'

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      position: 'relative'
    }}>
      {/* Indicador de impersonación */}
      {isImpersonating && showMenu && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.95), rgba(249, 115, 22, 0.95))',
          padding: '12px 20px',
          paddingRight: '80px',
          textAlign: 'center',
          color: 'white',
          fontWeight: 600,
          fontSize: '0.95em',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
          position: 'sticky',
          top: 0,
          zIndex: 98
        }}>
          🔐 Sesión como Administrador - Click en "Cerrar Sesión" para volver a SuperAdmin
        </div>
      )}

      {/* Header (se muestra/oculta con el menú) */}
      {showMenu && (
        null
      )}

      {/* Botón de menú flotante */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        style={{
          position: 'fixed',
          top: 20,
          right: 20,
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.95) 0%, rgba(99, 102, 241, 0.95) 100%)',
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
          zIndex: 1000
        }}
      >
        ☰
      </button>

      {/* Estadísticas principales */}
      <div style={{
        maxWidth: 1400,
        margin: '30px auto',
        padding: '0 20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          marginBottom: 30
        }}>
          {/* Total Cobrado Hoy */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(22, 163, 74, 0.15) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: '2.5em', 
              marginBottom: 8,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>💰</div>
            <div style={{ 
              fontSize: '2em', 
              fontWeight: 700,
              color: '#22c55e',
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 220,
              wordBreak: 'break-all',
              display: 'block'
            }}>
              {`$${isNaN(Number(totalCobrado)) ? '0.00' : Number(totalCobrado).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div style={{ 
              fontSize: '0.95em',
              opacity: 0.8,
              color: 'var(--text-primary)'
            }}>
              Total Cobrado Hoy
            </div>
          </div>

          {/* Clientes Atendidos */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: '2.5em', 
              marginBottom: 8,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>👥</div>
            <div style={{ 
              fontSize: '2em', 
              fontWeight: 700,
              color: '#3b82f6',
              marginBottom: 4
            }}>
              {clientesConAbono}
            </div>
            <div style={{ 
              fontSize: '0.95em',
              opacity: 0.8,
              color: 'var(--text-primary)'
            }}>
              Clientes Atendidos
            </div>
          </div>

          {/* Total Deuda */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(147, 51, 234, 0.15) 100%)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: '2.5em', 
              marginBottom: 8,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>💼</div>
            <div style={{ 
              fontSize: '2em', 
              fontWeight: 700,
              color: '#a855f7',
              marginBottom: 4,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 220,
              wordBreak: 'break-all',
              display: 'block'
            }}>
              {`$${isNaN(Number(totalDeuda)) ? '0.00' : Number(totalDeuda).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </div>
            <div style={{ 
              fontSize: '0.95em',
              opacity: 0.8,
              color: 'var(--text-primary)'
            }}>
              Cartera Total
            </div>
          </div>

          {/* Clientes Vencidos */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.15) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <div style={{ 
              fontSize: '2.5em', 
              marginBottom: 8,
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
            }}>⚠️</div>
            <div style={{ 
              fontSize: '2em', 
              fontWeight: 700,
              color: '#ef4444',
              marginBottom: 4
            }}>
              {clientesVencidos}
            </div>
            <div style={{ 
              fontSize: '0.95em',
              opacity: 0.8,
              color: 'var(--text-primary)'
            }}>
              Clientes Vencidos
            </div>
          </div>
        </div>

        {/* Acciones principales */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 16
        }}>
          {/* Botón Crear Cobrador SIEMPRE visible arriba */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowCrearCobrador(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: 12,
                padding: '24px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '1em',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <span style={{ fontSize: '2.5em' }}>➕</span>
              <span style={{ fontWeight: 600 }}>Crear Cobrador</span>
              <span style={{ fontSize: '0.85em', opacity: 0.7 }}>Agregar nuevo cobrador a tu equipo</span>
            </button>
          </div>

          {/* La lista de cobradores se muestra automáticamente */}

          {/* Botón Asignar Rutas solo para superadmin */}
          {user.role !== 'admin' && (
            <button
              onClick={() => setShowEnrutar(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.2) 100%)',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                borderRadius: 12,
                padding: '24px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '1em',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                transition: 'all 0.3s',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(236, 72, 153, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              }}
            >
              <span style={{ fontSize: '2.5em' }}>🗺️</span>
              <span style={{ fontWeight: 600 }}>Asignar Rutas</span>
              <span style={{ fontSize: '0.85em', opacity: 0.7 }}>Distribuir clientes a cobradores</span>
            </button>
          )}

          {/* Botón Ver Resumen */}
          <button
            onClick={() => setShowResumen(true)}
            style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              borderRadius: 12,
              padding: '24px',
              cursor: 'pointer',
              color: 'var(--text-primary)',
              fontSize: '1em',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.3s',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)'
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(34, 197, 94, 0.3)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ fontSize: '2.5em' }}>📊</span>
            <span style={{ fontWeight: 600 }}>Ver Resumen</span>
            <span style={{ fontSize: '0.85em', opacity: 0.7 }}>Estadísticas de cobranza y gastos</span>
          </button>
        </div>

        {/* Cartera de Clientes */}
        <div style={{ marginTop: 40 }}>
          <h2 style={{ 
            margin: '0 0 20px 0',
            fontSize: '1.5em',
            color: 'var(--text-primary)'
          }}>
            📋 Cartera de Clientes
          </h2>

          {/* Búsqueda y filtros */}
          <div style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            flexWrap: 'wrap'
          }}>
            <input
              type="text"
              placeholder="🔍 Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                flex: 1,
                minWidth: 250,
                padding: '12px 16px',
                fontSize: '1em',
                border: '1px solid var(--border)',
                borderRadius: 12,
                background: 'var(--glass)',
                color: 'var(--text-primary)',
                backdropFilter: 'blur(10px)'
              }}
            />
            
            <div style={{
              display: 'flex',
              gap: 8,
              background: 'var(--glass)',
              padding: 4,
              borderRadius: 12,
              border: '1px solid var(--border)'
            }}>
              {(['todos', 'activos', 'al-dia', 'vencidos'] as const).map((vista) => (
                <button
                  key={vista}
                  onClick={() => setVistaCartera(vista)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    fontWeight: 600,
                    background: vistaCartera === vista 
                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))'
                      : 'transparent',
                    color: vistaCartera === vista ? '#8b5cf6' : 'var(--text-secondary)',
                    transition: 'all 0.3s'
                  }}
                >
                  {vista === 'todos' ? '📋 Todos' :
                   vista === 'activos' ? '💼 Activos' :
                   vista === 'al-dia' ? '✅ Al Día' : '⚠️ Vencidos'}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de clientes */}
          <div style={{
            display: 'grid',
            gap: 12
          }}>
            {clientesOrdenados.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: 60,
                background: 'var(--glass)',
                borderRadius: 16,
                border: '1px solid var(--border)'
              }}>
                <div style={{ fontSize: '3em', marginBottom: 16 }}>
                  {searchTerm ? '🔍' : '📋'}
                </div>
                <div style={{ fontSize: '1.2em', opacity: 0.7 }}>
                  {searchTerm 
                    ? 'No se encontraron clientes'
                    : 'No hay clientes en esta categoría'}
                </div>
              </div>
            ) : (
              clientesOrdenados.map((c, index) => {
                const vencido = c.vencimiento && new Date(c.vencimiento) < new Date()
                const tieneAbonoHoy = (c.payments || []).some((p: any) => 
                  p.date?.startsWith(hoy)
                )
                
                return (
                  <div
                    key={c.id}
                    style={{
                      background: vencido 
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.1) 100%)'
                        : tieneAbonoHoy
                        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.1) 100%)'
                        : 'var(--glass)',
                      border: vencido
                        ? '1px solid rgba(239, 68, 68, 0.3)'
                        : tieneAbonoHoy
                        ? '1px solid rgba(34, 197, 94, 0.3)'
                        : '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 16,
                      transition: 'all 0.3s',
                      cursor: 'pointer'
                    }}
                    onClick={() => openDetail(c)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <div style={{
                        fontSize: '1.5em',
                        fontWeight: 700,
                        color: 'var(--text-secondary)',
                        minWidth: 40
                      }}>
                        #{index + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 4
                        }}>
                          {vencido && <span style={{ fontSize: '1.2em' }}>⚠️</span>}
                          {tieneAbonoHoy && <span style={{ fontSize: '1.2em' }}>✅</span>}
                          <span style={{
                            fontSize: '1.1em',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                          }}>
                            {c.nombre}
                          </span>
                        </div>
                        <div style={{
                          fontSize: '0.9em',
                          color: 'var(--text-secondary)'
                        }}>
                          {c.vencimiento && `Vence: ${new Date(c.vencimiento).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>
                    
                    <div style={{
                      fontSize: '1.3em',
                      fontWeight: 700,
                      color: vencido ? '#ef4444' : '#8b5cf6',
                      textAlign: 'right',
                      minWidth: 120,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: 180,
                      wordBreak: 'break-all',
                      display: 'block'
                    }}>
                      {`$${isNaN(Number(c.deuda)) ? '0.00' : Number(c.deuda).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Sync Indicator */}
      <SyncIndicator />

      {/* Menú lateral */}
      {showMenu && (
        <>
          <div 
            onClick={() => setShowMenu(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.6)',
              zIndex: 1001
            }}
          />
          <div style={{
            position: 'fixed',
            top: 0,
            right: 0,
            bottom: 0,
            width: 320,
            background: theme === 'dark' ? '#1a1a1a' : '#ffffff',
            borderLeft: '1px solid var(--border)',
            zIndex: 1002,
            padding: '20px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '-4px 0 20px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{ 
              margin: '0 0 20px 0',
              fontSize: '1.5em',
              color: 'var(--text-primary)'
            }}>
              Menú
            </h2>

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
                color: 'var(--text-primary)',
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

            <div style={{
              padding: '16px',
              borderTop: '1px solid var(--border)',
              marginTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(99, 102, 241, 0.3))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.2em'
                }}>
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.05em' }}>{user.nombre}</div>
                  <div style={{ fontSize: '0.85em', opacity: 0.7 }}>Administrador</div>
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
                padding: '16px',
                cursor: 'pointer',
                color: '#ef4444',
                fontSize: '1em',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 'auto',
                transition: 'all 0.3s'
              }}
            >
              <span style={{ fontSize: '1.5em' }}>🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </>
      )}

      {/* Modales */}
      {showResumen && (
        <ResumenModal 
          onClose={() => setShowResumen(false)} 
          clients={clients}
          gastosRefresh={gastosRefresh}
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

      {showEnrutar && (
        <EnrutarModal 
          onClose={() => setShowEnrutar(false)} 
          onSuccess={() => {
            refresh()
            setRutaVersion(v => v + 1)
          }}
        />
      )}

      {showCrearCobrador && (
        <CrearCobradorModal
          onClose={() => setShowCrearCobrador(false)}
          onSuccess={() => {
            // Refrescar lista de cobradores si está abierta
            setShowCrearCobrador(false)
          }}
          adminToken={user.token}
        />
      )}

      {/* Tus Cobradores como sección principal */}
      <div style={{ margin: '40px 0' }}>
        <ListaCobradoresModal
          adminToken={user.token}
          adminId={user.id}
        />
      </div>
    </div>
	);
}
