import React, { useMemo, useState } from 'react'
import { createCredit } from '../services/api'

type Props = {
  clientId: string
  clientName: string
  onClose: () => void
  onCreditCreated?: () => void
}

export default function CreditModal({ clientId, clientName, onClose, onCreditCreated }: Props) {
  const [amount, setAmount] = useState('')
  const [interest, setInterest] = useState('20')
  const [frequency, setFrequency] = useState<'diario'|'semanal'|'quincenal'|'mensual'>('diario')
  const [cuotas, setCuotas] = useState('30')
  const [loading, setLoading] = useState(false)

  // Auto-ajustar cuotas según frecuencia
  const handleFrequencyChange = (newFrequency: 'diario'|'semanal'|'quincenal'|'mensual') => {
    setFrequency(newFrequency)
    switch(newFrequency) {
      case 'diario': setCuotas('30'); break
      case 'semanal': setCuotas('4'); break
      case 'quincenal': setCuotas('2'); break
      case 'mensual': setCuotas('1'); break
    }
  }

  const numericAmount = Number(amount) || 0
  const numericInterest = Number(interest) || 0
  const numericCuotas = Number(cuotas) || 1
  const total = useMemo(() => Math.round((numericAmount + (numericAmount * numericInterest)/100) * 100) / 100, [numericAmount, numericInterest])
  const valorCuota = useMemo(() => Math.round((total / numericCuotas) * 100) / 100, [total, numericCuotas])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!numericAmount || numericAmount <= 0) return alert('Introduce un valor de crédito válido')
    setLoading(true)
    
    try {
      const result = await createCredit(clientId, { amount: numericAmount, interest: numericInterest, frequency, cuotas: numericCuotas })
      
      if (!result) {
        setLoading(false)
        alert('❌ Error al registrar el crédito')
        return
      }
      
      setLoading(false)
      onCreditCreated && onCreditCreated()
      onClose()
    } catch (error: any) {
      setLoading(false)
      console.error('❌ Error completo al crear crédito:', error)
      console.error('Error tipo:', typeof error)
      console.error('Error keys:', error ? Object.keys(error) : 'null')
      
      // Mostrar el mensaje de error específico
      let errorMessage = 'Error desconocido al crear el crédito'
      
      if (error?.message) {
        errorMessage = error.message
      } else if (error?.error) {
        errorMessage = error.error
      } else if (typeof error === 'string') {
        errorMessage = error
      }
      
      if (error?.error === 'ACTIVE_CREDIT_EXISTS' || errorMessage.includes('crédito activo')) {
        alert('⚠️ Este cliente ya tiene un crédito activo.\nDebe terminar de pagarlo antes de registrar uno nuevo.')
      } else if (errorMessage.includes('Cliente no encontrado') || error?.error === 'CLIENT_NOT_FOUND') {
        alert('❌ Error: El cliente no fue encontrado en la base de datos.\n\nPor favor, espera unos segundos y vuelve a intentarlo, o recarga la página.')
      } else {
        alert(`❌ Error al registrar el crédito:\n\n${errorMessage}\n\nID del cliente: ${clientId}`)
      }
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Registrar crédito — {clientName}</h3>
        <form onSubmit={submit}>
          <label>
            Valor del crédito
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label>
            Interés (%)
            <input type="number" value={interest} onChange={(e) => setInterest(e.target.value)} />
          </label>
          <label>
            Total a pagar
            <input value={String(total)} readOnly />
          </label>
          <label>
            Número de cuotas
            <input type="number" min="1" value={cuotas} onChange={(e) => setCuotas(e.target.value)} />
          </label>
          <label>
            Valor por cuota
            <input value={String(valorCuota)} readOnly />
          </label>
          <label>
            Forma de pago
            <select value={frequency} onChange={(e) => handleFrequencyChange(e.target.value as any)}>
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="quincenal">Quincenal</option>
              <option value="mensual">Mensual</option>
            </select>
          </label>

          <div style={{ marginTop: 10 }}>
            <small>Opciones de pago: diario, semanal, quincenal, mensual.</small>
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={onClose} className="ghost">Cancelar</button>
            <button type="submit" className="primary" disabled={loading}>{loading ? 'Guardando...' : 'Registrar crédito'}</button>
          </div>
        </form>
      </div>
      <style>{`
        /* Solid backdrop */
        .modal-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:150;pointer-events:auto;background:#071021}
        .modal{pointer-events:auto;background:#071021;padding:18px;border-radius:12px;width:480px;color:#e6eef6;box-shadow:0 8px 30px rgba(2,6,23,0.6);border:1px solid rgba(255,255,255,0.03)}
        .modal h3{margin:0 0 12px}
        .modal label{display:block;color:#e6eef6;margin-bottom:8px}
        .modal input,.modal select{width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:#e6eef6}
      `}</style>
    </div>
  )
}
