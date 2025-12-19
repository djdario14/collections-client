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
  user?: {
    id: number
    token: string
  }
}

function EnrutarModal({ onClose, onRutaGuardada, user }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    getClients().then((list) => {
      const today = new Date().toISOString().split('T')[0]
      let clientesPendientes = list.filter((c: any) => {
        if (c.deuda <= 0) return false
        const pagosHoy = (c.payments || []).filter((p: any) => {
          const fechaPago = p.date.split('T')[0]
          return fechaPago === today
        })
        return pagosHoy.length === 0
      })
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

  const guardarRuta = async () => {
    const ruta = clientes.map((c, idx) => ({ clienteId: c.id, orden: idx + 1 }))
    try {
      if (user && user.id && user.token) {
        const res = await fetch(`/api/auth/cobradores/${user.id}/ruta`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`
          },
          body: JSON.stringify(ruta)
        })
        if (!res.ok) throw new Error('Error al guardar en backend')
      }
      localStorage.setItem('rutaClientes', JSON.stringify(ruta))
      localStorage.setItem('rutaCreada', new Date().toISOString())
      onRutaGuardada()
      alert('✓ Ruta guardada exitosamente')
      onClose()
    } catch (e) {
      alert('Error al guardar la ruta en el backend')
    }
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
      {/* ...estilos aquí... */}
    </div>
  )
}

export default EnrutarModal