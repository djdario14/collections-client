import React, { useState, useEffect } from 'react'
import { createPayment, getClientById } from '../services/api'

type Props = {
  clientId: string
  clientName: string
  onClose: () => void
  onPaymentCreated?: () => void
}

export default function CobroModal({ clientId, clientName, onClose, onPaymentCreated }: Props) {
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [deudaTotal, setDeudaTotal] = useState(0)
  const [creditoActivoId, setCreditoActivoId] = useState<string | null>(null)

  useEffect(() => {
    // Calcular 4% del último crédito sin interés y obtener deuda total
    getClientById(clientId).then((client) => {
      if (client) {
        setDeudaTotal(client.deuda || 0)
        if (client.credits && client.credits.length > 0) {
          // Buscar el crédito activo (último con saldo > 0)
          const creditosOrdenados = [...client.credits].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          
          // Calcular saldo de cada crédito
          const creditoConSaldo = creditosOrdenados.find(cr => {
            const pagosDelCredito = (client.payments || []).filter(p => p.creditId === cr.id)
            const abonoTotal = pagosDelCredito.reduce((sum, p) => sum + p.amount, 0)
            const saldo = cr.total - abonoTotal
            return saldo > 0
          })
          
          if (creditoConSaldo) {
            setCreditoActivoId(creditoConSaldo.id)
            const montoSinInteres = creditoConSaldo.amount // Monto original sin interés
            const cuatroPorciento = (montoSinInteres * 0.04).toFixed(2)
            setAmount(cuatroPorciento)
          }
        }
      }
    })
  }, [clientId])

  // Cuando se selecciona un estado, poner el monto en 0
  const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const valor = e.target.value
    setNotes(valor)
    if (valor) {
      setAmount('0')
    }
  }

  // Cancelar deuda total
  const cancelarDeudaTotal = async () => {
    if (!confirm(`¿Estás seguro de cancelar toda la deuda de $${deudaTotal.toLocaleString()} de ${clientName}?`)) {
      return
    }
    
    setLoading(true)
    const fecha = new Date().toISOString()
    await createPayment(clientId, { amount: deudaTotal, date: fecha, notes: 'Cancelación de deuda total', creditId: creditoActivoId })
    setLoading(false)
    onPaymentCreated && onPaymentCreated()
    onClose()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const num = Number(amount)
    
    // Si hay un estado seleccionado pero no hay monto, registrar pago en 0
    if (notes && (!num || num <= 0)) {
      setLoading(true)
      const fecha = new Date().toISOString() // Guardar timestamp completo
      await createPayment(clientId, { amount: 0, date: fecha, notes, creditId: creditoActivoId })
      setLoading(false)
      onPaymentCreated && onPaymentCreated()
      onClose()
      return
    }
    
    // Si hay monto, validar que sea válido
    if (!num || num <= 0) return alert('Introduce un importe válido')
    
    setLoading(true)
    const fecha = new Date().toISOString() // Guardar timestamp completo
    await createPayment(clientId, { amount: num, date: fecha, notes, creditId: creditoActivoId })
    setLoading(false)
    onPaymentCreated && onPaymentCreated()
    onClose()
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Registrar cobro — {clientName}</h3>
        <form onSubmit={submit}>
          <label>
            Abono
            <input 
              type="number" 
              step="0.01" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              onFocus={(e) => setAmount('')}
            />
          </label>
          <label>
            Motivo
            <select value={notes} onChange={handleEstadoChange} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)', background: '#0b1a2a', color: '#e6eef6' }}>
              <option value="">Seleccionar...</option>
              <option value="no se encuentra">No se encuentra</option>
              <option value="semanal">Semanal</option>
              <option value="no tiene">No tiene</option>
              <option value="clavo">Clavo</option>
            </select>
          </label>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={onClose} className="ghost">Cancelar</button>
            <button type="submit" className="primary" disabled={loading}>
              {loading ? 'Guardando...' : (notes && (!amount || amount === '0') ? 'Registrar estado' : 'Registrar cobro')}
            </button>
          </div>
          {deudaTotal > 0 && (
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <button 
                type="button" 
                onClick={cancelarDeudaTotal} 
                disabled={loading}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  background: '#10b981', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.95em'
                }}
              >
                ✅ Cancelar deuda total (${deudaTotal.toLocaleString()})
              </button>
            </div>
          )}
        </form>
      </div>
      <style>{`
        /* Solid non-transparent backdrop so underlying content does not show through */
        .modal-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:150;pointer-events:auto;background:#071021}
        .modal{pointer-events:auto;background:#071021;padding:18px;border-radius:12px;width:420px;color:#e6eef6;box-shadow:0 8px 30px rgba(2,6,23,0.6);border:1px solid rgba(255,255,255,0.03)}
        .modal h3{margin:0 0 12px}
        .modal label{display:block;color:#e6eef6;margin-bottom:8px}
        .modal input,.modal textarea{width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:#e6eef6}
        .modal textarea{height:80px}
      `}</style>
    </div>
  )
}
