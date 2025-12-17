import { useState, useEffect } from 'react'
import { getClients } from '../services/api'

type Cliente = {
  id: string
  nombre: string
  deuda: number
  vencimiento: string
}

type Props = {
  onClose: () => void
  onRutaGuardada: () => void
}

export default function EnrutarModal({ onClose, onRutaGuardada }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    // Cargar solo clientes pendientes (deuda > 0 y sin abono hoy)
    getClients().then((list) => {
      const today = new Date().toISOString().split('T')[0]
      
      // Filtrar clientes con deuda > 0 que NO han abonado hoy
      let clientesPendientes = list.filter((c: any) => {
        if (c.deuda <= 0) return false
        
        // Verificar si pagó hoy
        const pagosHoy = (c.payments || []).filter((p: any) => {
          const fechaPago = p.date.split('T')[0]
          return fechaPago === today
        })
        
        return pagosHoy.length === 0
      })
      
      // Aplicar orden guardado si existe
      const rutaGuardada = localStorage.getItem('rutaClientes')
      if (rutaGuardada) {
        try {
          const ruta = JSON.parse(rutaGuardada)
          const ordenMap = new Map(ruta.map((r: any) => [r.clienteId, r.orden]))
          
          clientesPendientes.sort((a, b) => {
            const ordenA = ordenMap.get(a.id) ?? 9999
            const ordenB = ordenMap.get(b.id) ?? 9999
            return Number(ordenA) - Number(ordenB)
          })
        } catch (e) {
          console.error('Error al cargar ruta guardada:', e)
        }
      }
      
      setClientes(clientesPendientes)
      setLoading(false)
    })
  }, [])

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const newClientes = [...clientes]
    const draggedCliente = newClientes[draggedIndex]
    newClientes.splice(draggedIndex, 1)
    newClientes.splice(index, 0, draggedCliente)
    
    setClientes(newClientes)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const moverArriba = (index: number) => {
    if (index === 0) return
    const newClientes = [...clientes]
    const temp = newClientes[index]
    newClientes[index] = newClientes[index - 1]
    newClientes[index - 1] = temp
    setClientes(newClientes)
  }

  const moverAbajo = (index: number) => {
    if (index === clientes.length - 1) return
    const newClientes = [...clientes]
    const temp = newClientes[index]
    newClientes[index] = newClientes[index + 1]
    newClientes[index + 1] = temp
    setClientes(newClientes)
  }

  const guardarRuta = () => {
    // Guardar la ruta en localStorage
    const ruta = clientes.map((c, idx) => ({
      orden: idx + 1,
      clienteId: c.id,
      nombre: c.nombre,
      deuda: c.deuda
    }))
    localStorage.setItem('rutaClientes', JSON.stringify(ruta))
    localStorage.setItem('rutaCreada', new Date().toISOString())
    onRutaGuardada()
    alert('✓ Ruta guardada exitosamente')
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="enrutar-modal" onClick={(e) => e.stopPropagation()}>
        <div className="enrutar-header">
          <h3>🗺️ Enrutar Clientes</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="enrutar-info">
          <p>Arrastra o usa los botones para ordenar tus clientes en la ruta de cobro</p>
          <span className="total-clientes">{clientes.length} clientes con deuda pendiente</span>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Cargando clientes...</div>
        ) : (
          <div className="clientes-ruta">
            {clientes.map((cliente, index) => (
              <div
                key={cliente.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`cliente-ruta-item ${draggedIndex === index ? 'dragging' : ''}`}
              >
                <div className="ruta-orden">{index + 1}</div>
                <div className="ruta-info">
                  <div className="ruta-nombre">{cliente.nombre}</div>
                  <div className="ruta-deuda">Deuda: ${(Number(cliente.deuda) || 0).toFixed(2)}</div>
                </div>
                <div className="ruta-acciones">
                  <button
                    onClick={() => moverArriba(index)}
                    disabled={index === 0}
                    className="ruta-btn"
                    title="Mover arriba"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moverAbajo(index)}
                    disabled={index === clientes.length - 1}
                    className="ruta-btn"
                    title="Mover abajo"
                  >
                    ▼
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="enrutar-footer">
          <button onClick={onClose} className="btn-cancelar">Cancelar</button>
          <button onClick={guardarRuta} className="btn-guardar">💾 Guardar Ruta</button>
        </div>
      </div>

      <style>{`
        .modal-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:150;background:rgba(7,16,33,0.9)}
        .enrutar-modal{background:var(--card);border-radius:16px;width:90%;max-width:600px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,0.4);border:1px solid var(--border)}
        .enrutar-header{background:var(--glass);padding:20px 24px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;border-radius:16px 16px 0 0}
        .enrutar-header h3{margin:0;font-size:1.5em;font-weight:700;color:var(--text)}
        .close-btn{background:none;border:none;font-size:24px;color:var(--muted);cursor:pointer;padding:0;transition:color 0.2s}
        .close-btn:hover{color:var(--text)}
        .enrutar-info{padding:20px 24px;background:var(--glass);border-bottom:1px solid var(--border)}
        .enrutar-info p{margin:0 0 8px;color:var(--text);font-size:0.95em}
        .total-clientes{color:var(--accent);font-weight:600;font-size:0.9em}
        .clientes-ruta{flex:1;overflow-y:auto;padding:16px 24px}
        .cliente-ruta-item{display:flex;align-items:center;gap:12px;padding:14px;background:var(--glass);border:1px solid var(--border);border-radius:10px;margin-bottom:10px;cursor:move;transition:all 0.2s}
        .cliente-ruta-item:hover{background:rgba(255,255,255,0.08);border-color:var(--accent)}
        .cliente-ruta-item.dragging{opacity:0.5;transform:scale(0.98)}
        .ruta-orden{background:var(--accent);color:#000;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.9em;flex-shrink:0}
        .ruta-info{flex:1;min-width:0}
        .ruta-nombre{color:var(--text);font-weight:600;font-size:0.95em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .ruta-deuda{color:var(--muted);font-size:0.85em;margin-top:2px}
        .ruta-acciones{display:flex;gap:6px}
        .ruta-btn{background:var(--glass);border:1px solid var(--border);color:var(--text);width:32px;height:32px;border-radius:6px;cursor:pointer;font-size:0.8em;transition:all 0.2s}
        .ruta-btn:hover:not(:disabled){background:var(--accent);color:#000}
        .ruta-btn:disabled{opacity:0.3;cursor:not-allowed}
        .enrutar-footer{padding:20px 24px;background:var(--glass);border-top:1px solid var(--border);display:flex;gap:12px;border-radius:0 0 16px 16px}
        .btn-cancelar{flex:1;padding:12px;border-radius:10px;border:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer;font-weight:600;transition:all 0.2s}
        .btn-cancelar:hover{background:var(--glass)}
        .btn-guardar{flex:1;padding:12px;border-radius:10px;border:none;background:linear-gradient(90deg,#34d399,#06b6d4);color:#012;cursor:pointer;font-weight:600;box-shadow:0 4px 12px rgba(6,182,212,0.2);transition:opacity 0.2s}
        .btn-guardar:hover{opacity:0.9}

        [data-theme="light"] .enrutar-modal{background:#ffffff;border:1px solid rgba(0,0,0,0.1)}
        [data-theme="light"] .enrutar-header{background:#f1f5f9;border-bottom:1px solid rgba(0,0,0,0.1)}
        [data-theme="light"] .enrutar-header h3{color:#000000}
        [data-theme="light"] .close-btn{color:#475569}
        [data-theme="light"] .close-btn:hover{color:#000000}
        [data-theme="light"] .enrutar-info{background:#f8fafc;border-bottom:1px solid rgba(0,0,0,0.1)}
        [data-theme="light"] .enrutar-info p{color:#000000}
        [data-theme="light"] .cliente-ruta-item{background:#ffffff;border:1px solid rgba(0,0,0,0.1)}
        [data-theme="light"] .cliente-ruta-item:hover{background:#f8fafc}
        [data-theme="light"] .ruta-nombre{color:#000000}
        [data-theme="light"] .ruta-deuda{color:#475569;font-weight:600}
        [data-theme="light"] .ruta-btn{background:#f1f5f9;border:1px solid rgba(0,0,0,0.15);color:#000000}
        [data-theme="light"] .enrutar-footer{background:#f1f5f9;border-top:1px solid rgba(0,0,0,0.1)}
        [data-theme="light"] .btn-cancelar{border:1px solid rgba(0,0,0,0.2);color:#000000}
        [data-theme="light"] .btn-cancelar:hover{background:#e2e8f0}
      `}</style>
    </div>
  )
}
