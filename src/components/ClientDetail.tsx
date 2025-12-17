import React, { useEffect, useState } from 'react'
import { getClientById, updateClient } from '../services/api'

type Payment = { id: string; amount: number; date: string; notes?: string; creditId?: string }
type Credit = { 
  id: string
  amount: number
  interest: number
  total: number
  frequency: string
  date: string
  cuotas?: number
  valorCuota?: number
}
type Cliente = { 
  id: string
  nombre: string
  identificacion?: string
  deuda: number
  vencimiento: string
  ubicacionGps?: string
  direccion?: string
  negocio?: string
  telefono?: string
  payments?: Payment[]
  credits?: Credit[]
  createdAt?: string
}

type Props = {
  clientId: string
  onClose: () => void
  theme?: 'dark' | 'light'
}

export default function ClientDetail({ clientId, onClose, theme = 'dark' }: Props) {
  const [client, setClient] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [showHistorial, setShowHistorial] = useState(false)
  const [editando, setEditando] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '',
    identificacion: '',
    telefono: '',
    negocio: '',
    ubicacionGps: ''
  })

  const loadClient = (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true)
    }
    getClientById(clientId).then((c) => {
      setClient(c || null)
      if (isInitialLoad) {
        setLoading(false)
      }
      if (c) {
        setFormData({
          nombre: c.nombre || '',
          identificacion: c.identificacion || '',
          telefono: c.telefono || '',
          negocio: c.negocio || '',
          ubicacionGps: c.ubicacionGps || ''
        })
      }
    })
  }

  useEffect(() => {
    loadClient(true) // Carga inicial con loading
    // Auto-refresh cada 3 segundos solo si no está editando (sin loading)
    if (!editando) {
      const interval = setInterval(() => loadClient(false), 3000)
      return () => clearInterval(interval)
    }
  }, [clientId, editando])

  const handleGuardarCambios = async () => {
    if (!client) return
    
    console.log('🔍 Guardando cambios para cliente:', client.id)
    console.log('📝 Datos del formulario:', formData)
    
    const result = await updateClient(client.id, formData)
    
    console.log('✅ Resultado de la API:', result)
    
    if (result) {
      setClient(result)
      setEditando(false)
      alert('✓ Información actualizada')
    } else {
      alert('❌ Error al actualizar la información')
    }
  }

  const handleCancelarEdicion = () => {
    if (client) {
      setFormData({
        nombre: client.nombre || '',
        identificacion: client.identificacion || '',
        telefono: client.telefono || '',
        negocio: client.negocio || '',
        ubicacionGps: client.ubicacionGps || ''
      })
    }
    setEditando(false)
  }

  // Obtener el crédito activo más reciente (con saldo > 0)
  const getCreditoActivo = () => {
    if (!client || !client.credits || client.credits.length === 0) return null
    
    // Ordenar créditos por fecha descendente y encontrar el primero con saldo > 0
    const creditosOrdenados = [...client.credits].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )
    
    for (const credit of creditosOrdenados) {
      const detalles = calcularDetallesCredito(credit)
      if (detalles.saldo > 0) {
        return credit
      }
    }
    
    return null
  }

  // Calcular días de atraso (considerando que múltiples pagos en un día cubren múltiples días)
  const calcularDiasAtraso = (credit: Credit, payments: Payment[]) => {
    const fechaCredito = new Date(credit.date)
    fechaCredito.setHours(0, 0, 0, 0)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    // Si el crédito es de hoy, no hay atraso todavía
    if (fechaCredito.getTime() === hoy.getTime()) {
      return 0
    }
    
    // Calcular días transcurridos desde el crédito (sin contar el día de hoy)
    const diasTranscurridos = Math.floor((hoy.getTime() - fechaCredito.getTime()) / (1000 * 60 * 60 * 24))
    
    // Contar cuántos pagos se han hecho en total para este crédito
    const totalPagosRealizados = payments
      .filter(p => p.creditId === credit.id && p.amount > 0)
      .length
    
    // Días de atraso = días transcurridos - pagos realizados
    const diasAtraso = diasTranscurridos - totalPagosRealizados
    
    return diasAtraso > 0 ? diasAtraso : 0
  }
  
  // Calcular si está en mora (solo después de 30 días)
  const calcularDiasMora = (credit: Credit, saldo: number) => {
    const fechaCredito = new Date(credit.date)
    const hoy = new Date()
    const diasTranscurridos = Math.floor((hoy.getTime() - fechaCredito.getTime()) / (1000 * 60 * 60 * 24))
    
    // Solo hay mora si pasaron 30 días y aún tiene saldo pendiente
    if (diasTranscurridos > 30 && saldo > 0) {
      return diasTranscurridos - 30
    }
    
    return 0
  }

  // Calcular cuotas pagadas y abono total por crédito
  const calcularDetallesCredito = (credit: Credit) => {
    if (!client) return { abonoTotal: 0, cuotasPagadas: 0, saldo: credit.total, cuotasAtrasadas: credit.cuotas || 1, diasMora: 0, diasAtraso: 0, valorCuotaReal: 0, cuotasCorregidas: 1 }
    
    // Corregir número de cuotas según la frecuencia
    let cuotasCorregidas = credit.cuotas || 1
    switch(credit.frequency) {
      case 'diario': cuotasCorregidas = 30; break
      case 'semanal': cuotasCorregidas = 4; break
      case 'quincenal': cuotasCorregidas = 2; break
      case 'mensual': cuotasCorregidas = 1; break
      default: cuotasCorregidas = credit.cuotas || 1
    }
    
    // Filtrar SOLO los pagos que pertenecen a ESTE crédito específico
    const pagosPorCredito = client.payments?.filter(p => p.creditId === credit.id && p.amount > 0) || []
    
    const abonoTotal = pagosPorCredito.reduce((sum, p) => sum + p.amount, 0)
    const saldo = credit.total - abonoTotal
    
    // Valor de cuota es 4% del monto base sin intereses
    const valorCuotaReal = Math.round((credit.amount * 0.04) * 100) / 100
    const cuotasPagadas = valorCuotaReal > 0 ? Math.floor(abonoTotal / valorCuotaReal) : 0
    const cuotasAtrasadas = cuotasCorregidas - cuotasPagadas
    
    // Calcular días de atraso (días sin pago)
    const diasAtraso = calcularDiasAtraso(credit, client.payments || [])
    
    // Calcular días de mora (solo después de 30 días)
    const diasMora = calcularDiasMora(credit, saldo)
    
    return { abonoTotal, cuotasPagadas, saldo, cuotasAtrasadas, diasMora, diasAtraso, valorCuotaReal, cuotasCorregidas }
  }

  if (loading) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-detail" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2em', marginBottom: '10px' }}>⏳</div>
            <div>Cargando información del cliente...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="modal-detail" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2em', marginBottom: '10px' }}>⚠️</div>
          <div>Cliente no encontrado</div>
          <button onClick={onClose} style={{ marginTop: '20px', padding: '10px 20px', background: '#22c55e', border: 'none', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>
            Cerrar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-detail" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, fontSize: '24px', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', zIndex: 10 }}>✕</button>
        
        <div style={{ marginBottom: 24, marginTop: 8 }}>
          <h3 style={{ fontSize: '1.5em', margin: '0 0 12px 0' }}>{editando ? 'Editar Cliente' : client.nombre}</h3>
          
          {!editando && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button 
                onClick={() => setEditando(true)} 
                style={{ 
                  padding: '8px 16px', 
                  background: '#64748b', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontSize: '1.2em',
                  fontWeight: 600
                }}
                title="Editar información"
              >
                ✏️
              </button>
              
              <button 
                onClick={() => setShowHistorial(!showHistorial)} 
                style={{ 
                  padding: '8px 16px', 
                  background: '#3b82f6', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontSize: '1.2em',
                  fontWeight: 600
                }}
                title={showHistorial ? 'Volver' : 'Historial Crediticio'}
              >
                {showHistorial ? '◀️' : '📋'}
              </button>
              
              {client.telefono && (
                <button
                  onClick={() => {
                    const phone = client.telefono.replace(/\D/g, '')
                    window.open(`https://wa.me/${phone}`, '_blank')
                  }}
                  style={{
                    padding: '8px 16px',
                    background: '#25D366',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '1.2em',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  title="Abrir WhatsApp"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
        
        {editando ? (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ color: theme === 'light' ? '#1e293b' : '#64748b', fontWeight: 700, fontSize: '0.95em' }}>Nombre</span>
                <input 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: theme === 'light' ? '2px solid #cbd5e1' : '2px solid rgba(100,200,255,0.3)',
                    background: theme === 'light' ? '#ffffff' : 'rgba(30,40,55,0.5)',
                    color: theme === 'light' ? '#000000' : '#e6eef6',
                    fontSize: '1em'
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ color: theme === 'light' ? '#1e293b' : '#64748b', fontWeight: 700, fontSize: '0.95em' }}>Identificación</span>
                <input 
                  value={formData.identificacion} 
                  onChange={(e) => setFormData({ ...formData, identificacion: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: theme === 'light' ? '2px solid #cbd5e1' : '2px solid rgba(100,200,255,0.3)',
                    background: theme === 'light' ? '#ffffff' : 'rgba(30,40,55,0.5)',
                    color: theme === 'light' ? '#000000' : '#e6eef6',
                    fontSize: '1em'
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ color: theme === 'light' ? '#1e293b' : '#64748b', fontWeight: 700, fontSize: '0.95em' }}>Teléfono</span>
                <input 
                  value={formData.telefono} 
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: theme === 'light' ? '2px solid #cbd5e1' : '2px solid rgba(100,200,255,0.3)',
                    background: theme === 'light' ? '#ffffff' : 'rgba(30,40,55,0.5)',
                    color: theme === 'light' ? '#000000' : '#e6eef6',
                    fontSize: '1em'
                  }}
                  placeholder="+593999999999"
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ color: theme === 'light' ? '#1e293b' : '#64748b', fontWeight: 700, fontSize: '0.95em' }}>Negocio</span>
                <input 
                  value={formData.negocio} 
                  onChange={(e) => setFormData({ ...formData, negocio: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: theme === 'light' ? '2px solid #cbd5e1' : '2px solid rgba(100,200,255,0.3)',
                    background: theme === 'light' ? '#ffffff' : 'rgba(30,40,55,0.5)',
                    color: theme === 'light' ? '#000000' : '#e6eef6',
                    fontSize: '1em'
                  }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ color: theme === 'light' ? '#1e293b' : '#64748b', fontWeight: 700, fontSize: '0.95em' }}>Ubicación GPS</span>
                <input 
                  value={formData.ubicacionGps} 
                  onChange={(e) => setFormData({ ...formData, ubicacionGps: e.target.value })}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: theme === 'light' ? '2px solid #cbd5e1' : '2px solid rgba(100,200,255,0.3)',
                    background: theme === 'light' ? '#ffffff' : 'rgba(30,40,55,0.5)',
                    color: theme === 'light' ? '#000000' : '#e6eef6',
                    fontSize: '1em'
                  }}
                  placeholder="lat,lng"
                />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button
                onClick={handleGuardarCambios}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: '1.05em',
                  fontWeight: 700
                }}
              >
                ✓ Guardar cambios
              </button>
              <button
                onClick={handleCancelarEdicion}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#64748b',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: '1.05em',
                  fontWeight: 700
                }}
              >
                ✕ Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            {client.identificacion && (
              <div className="info-item">
                <span className="info-label">Identificación</span>
                <span className="info-value">{client.identificacion}</span>
              </div>
            )}
            {client.negocio && (
              <div className="info-item">
                <span className="info-label">Negocio</span>
                <span className="info-value">{client.negocio}</span>
              </div>
            )}
            {client.direccion && (
              <div className="info-item">
                <span className="info-label">Dirección</span>
                <span className="info-value">{client.direccion}</span>
              </div>
            )}
            {client.telefono && (
              <div className="info-item">
                <span className="info-label">Teléfono</span>
                <span className="info-value">{client.telefono}</span>
              </div>
            )}
            {client.ubicacionGps && (
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <span className="info-label">Ubicación GPS</span>
                <span className="info-value">
                  <a href={`https://www.google.com/maps?q=${client.ubicacionGps}`} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none' }}>
                    📍 {client.ubicacionGps} (Ver en mapa)
                  </a>
                </span>
              </div>
            )}
          </div>
        )}

        {showHistorial ? (
          <section>
            <h4 style={{ marginBottom: 20, color: '#e6eef6', fontSize: '1.1em', fontWeight: 600 }}>Lista de prestamos</h4>
            {(!client.credits || client.credits.length === 0) ? (
              <p style={{ color: '#475569', textAlign: 'center', padding: '32px' }}>No hay créditos registrados</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {client.credits
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((cr) => {
                    const detalles = calcularDetallesCredito(cr)
                    const fecha = new Date(cr.date)
                    const dia = String(fecha.getDate()).padStart(2, '0')
                    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
                    const año = String(fecha.getFullYear()).slice(-2)
                    const fechaFormateada = `${dia}/${mes}/${año}`
                    const estadoPagado = detalles.saldo <= 0
                    
                    return (
                      <div key={cr.id} style={{ 
                        padding: '16px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: estadoPagado ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px',
                          flexShrink: 0
                        }}>
                          {estadoPagado ? '✓' : '○'}
                        </div>
                        
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'flex-start',
                            marginBottom: '4px'
                          }}>
                            <div>
                              <div style={{ 
                                fontSize: '1em', 
                                fontWeight: 600, 
                                color: '#e6eef6',
                                marginBottom: '2px'
                              }}>
                                Saldo: {Math.max(0, Number(detalles.saldo) || 0).toFixed(0)} - Valor: {cr.total}
                              </div>
                              <div style={{ 
                                fontSize: '0.85em', 
                                color: '#475569'
                              }}>
                                {fechaFormateada}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
              </div>
            )}
          </section>
        ) : (
          <>
            {!editando && client.credits && client.credits.length > 0 && (
              <section style={{ marginBottom: 24 }}>
                <h4 style={{ marginBottom: 12, color: '#e6eef6' }}>Créditos Activos</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {client.credits
                .filter((cr) => {
                  const detalles = calcularDetallesCredito(cr)
                  return detalles.saldo > 0 // Solo mostrar créditos con saldo pendiente
                }).
                map((cr) => {
                const detalles = calcularDetallesCredito(cr)
                const fecha = new Date(cr.date)
                const dia = String(fecha.getDate()).padStart(2, '0')
                const mes = String(fecha.getMonth() + 1).padStart(2, '0')
                const año = String(fecha.getFullYear()).slice(-2)
                const fechaFormateada = `${dia}/${mes}/${año}`
                
                return (
                  <div key={cr.id} style={{ 
                    padding: 16, 
                    background: detalles.diasMora > 0 ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.05)', 
                    borderRadius: 12, 
                    border: detalles.diasMora > 0 ? '2px solid #ef4444' : '1px solid rgba(59,130,246,0.2)',
                    position: 'relative',
                    paddingTop: 40
                  }}>
                    {detalles.diasMora > 0 && (
                      <div style={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        background: '#ef4444', 
                        color: 'white', 
                        padding: '4px 12px', 
                        borderRadius: 6, 
                        fontSize: '0.75em', 
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        zIndex: 1
                      }}>
                        ⚠️ EN MORA: {detalles.diasMora} días
                      </div>
                    )}
                    {detalles.diasMora === 0 && detalles.diasAtraso > 0 && (
                      <div style={{ 
                        position: 'absolute', 
                        top: 8, 
                        right: 8, 
                        background: '#f59e0b', 
                        color: 'white', 
                        padding: '4px 12px', 
                        borderRadius: 6, 
                        fontSize: '0.75em', 
                        fontWeight: 700,
                        zIndex: 1
                      }}>
                        Atraso: {detalles.diasAtraso} días
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: '0.9em' }}>
                      <div><span style={{ color: '#64748b', fontWeight: 700 }}>Fecha:</span> <span style={{ color: '#e6eef6', fontWeight: 500 }}>{fechaFormateada}</span></div>
                      <div><span style={{ color: '#64748b', fontWeight: 700 }}>Periodo:</span> <span style={{ color: '#e6eef6', fontWeight: 500, textTransform: 'capitalize' }}>{cr.frequency}</span></div>
                      
                      <div><span style={{ color: '#64748b', fontWeight: 700 }}>Valor:</span> <span style={{ color: '#3b82f6', fontWeight: 600 }}>${cr.amount.toLocaleString()}</span></div>
                      <div><span style={{ color: '#64748b', fontWeight: 700 }}>Saldo:</span> <span style={{ color: detalles.saldo > 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>${Math.max(0, Number(detalles.saldo) || 0).toFixed(2)}</span></div>
                      
                      <div><span style={{ color: '#64748b', fontWeight: 700 }}>Cuotas (Total):</span> <span style={{ color: '#e6eef6', fontWeight: 500 }}>{detalles.cuotasCorregidas}</span></div>
                      <div><span style={{ color: '#64748b', fontWeight: 700 }}>Cuotas pagadas:</span> <span style={{ color: detalles.cuotasPagadas >= detalles.cuotasCorregidas ? '#10b981' : '#f59e0b', fontWeight: 600 }}>{detalles.cuotasPagadas} / {detalles.cuotasCorregidas}</span></div>
                      
                      <div><span style={{ color: '#64748b', fontWeight: 700 }}>Valor de cuota:</span> <span style={{ color: '#e6eef6', fontWeight: 500 }}>${(Number(detalles.valorCuotaReal) || 0).toFixed(2)}</span></div>
                      <div><span style={{ color: '#64748b', fontWeight: 700 }}>Abonos:</span> <span style={{ color: '#10b981', fontWeight: 600 }}>${(Number(detalles.abonoTotal) || 0).toFixed(2)}</span></div>
                      
                      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 24 }}>
                        {detalles.diasAtraso > 0 && (
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 700 }}>Días sin pago:</span> <span style={{ color: '#f59e0b', fontWeight: 600 }}>{detalles.diasAtraso} días</span>
                          </div>
                        )}
                        {detalles.diasMora > 0 && (
                          <div>
                            <span style={{ color: '#64748b', fontWeight: 700 }}>Días en mora:</span> <span style={{ color: '#ef4444', fontWeight: 700 }}>{detalles.diasMora} días</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {!editando && (
          <section>
            <h4 style={{ marginBottom: 12, color: '#e6eef6' }}>Pagos registrados</h4>
            {(!client.payments || client.payments.length === 0) && <p>No hay pagos</p>}
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {client.payments?.map((p) => {
              const fecha = new Date(p.date)
              const fechaFormateada = fecha.toLocaleDateString('es-ES')
              const horaFormateada = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
              const esEstado = p.amount === 0 && p.notes
              return (
                <li key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  {esEstado ? (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#f59e0b', textTransform: 'capitalize' }}>
                          📍 Motivo: {p.notes}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85em', color: '#475569', marginTop: 4 }}>{fechaFormateada} • {horaFormateada}</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: '#2ecc71' }}>${p.amount.toLocaleString()}</span>
                        <span style={{ fontSize: '0.85em', color: '#475569' }}>{fechaFormateada} • {horaFormateada}</span>
                      </div>
                      {p.notes && <div style={{ fontSize: '0.9em', color: '#cbd5e1', marginTop: 4 }}>{p.notes}</div>}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
        )}
          </>
        )}
      </div>
      <style>{`
        .modal-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:150;pointer-events:auto;background:#071021}
        .modal-detail{background:#0b1a2a;padding:32px;border-radius:16px;width:700px;max-width:90vw;color:#e6eef6;max-height:90vh;overflow-y:auto;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.05)}
        .info-item{display:flex;flex-direction:column;gap:4px}
        .info-label{font-size:0.85em;color:#475569;font-weight:500}
        .info-value{font-size:1em;color:#e6eef6;font-weight:600}
      `}</style>
    </div>
  )
}
