import { useState } from 'react'

type Props = {
  onClose: () => void
  onGastoCreated?: () => void
}

export default function GastoModal({ onClose, onGastoCreated }: Props) {
  const [descripcion, setDescripcion] = useState('')
  const [monto, setMonto] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!descripcion.trim() || !monto) return alert('Descripción y monto requeridos')
    
    setLoading(true)
    
    // Guardar en localStorage por ahora
    const gastos = JSON.parse(localStorage.getItem('gastos') || '[]')
    const nuevoGasto = {
      id: Date.now().toString(),
      descripcion: descripcion.trim(),
      monto: parseFloat(monto),
      fecha: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    }
    gastos.push(nuevoGasto)
    localStorage.setItem('gastos', JSON.stringify(gastos))
    
    setLoading(false)
    setDescripcion('')
    setMonto('')
    onGastoCreated && onGastoCreated()
  }

  // Obtener gastos del día actual
  const today = new Date().toISOString().split('T')[0]
  const gastosDelDia = JSON.parse(localStorage.getItem('gastos') || '[]')
    .filter((g: any) => g.fecha === today)
    .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return (
    <div className="modal-backdrop">
      <div className="modal-gastos">
        <div className="gastos-header">
          <h3>Gastos</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <form onSubmit={submit} className="gastos-form">
          <div className="form-group">
            <label>Gasto</label>
            <input 
              value={monto} 
              onChange={(e) => setMonto(e.target.value)}
              placeholder="Valor"
              type="number"
              step="0.01"
              className="input-field"
            />
          </div>
          
          <div className="form-group">
            <label>Descripción</label>
            <input 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Descripcion"
              className="input-field"
            />
          </div>

          <button type="submit" className="guardar-btn" disabled={loading}>
            💾 {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </form>

        <div className="gastos-list">
          {gastosDelDia.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px' }}>No hay gastos registrados hoy</p>
          ) : (
            gastosDelDia.map((gasto: any) => {
              const fecha = new Date(gasto.timestamp)
              const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
              const horaFormateada = fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
              
              return (
                <div key={gasto.id} className="gasto-item">
                  <div className="gasto-info">
                    <div className="gasto-fecha">Fecha : {fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1)}, {horaFormateada}</div>
                    <div className="gasto-desc">Descripción : {gasto.descripcion}</div>
                    <div className="gasto-valor">Valor : {gasto.monto}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
      <style>{`
        .modal-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:150;pointer-events:auto;background:#071021}
        .modal-gastos{pointer-events:auto;background:#0b1a2a;padding:0;border-radius:16px;width:90%;max-width:700px;color:#e6eef6;box-shadow:0 20px 60px rgba(0,0,0,0.4);border:1px solid rgba(255,255,255,0.05);max-height:90vh;display:flex;flex-direction:column}
        .gastos-header{background:rgba(255,255,255,0.03);padding:20px 24px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;border-radius:16px 16px 0 0}
        .gastos-header h3{margin:0;font-size:1.5em;font-weight:700;color:#e6eef6}
        .close-btn{background:none;border:none;font-size:24px;color:#94a3b8;cursor:pointer;padding:0;line-height:1;transition:color 0.2s}
        .close-btn:hover{color:#e6eef6}
        .gastos-form{padding:24px;background:rgba(255,255,255,0.02);border-bottom:1px solid rgba(255,255,255,0.08)}
        .form-group{margin-bottom:16px}
        .form-group label{display:block;color:#94a3b8;font-size:0.9em;font-weight:500;margin-bottom:6px}
        .input-field{width:100%;padding:12px 16px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.05);color:#e6eef6;font-size:1em;box-sizing:border-box}
        .input-field:focus{outline:none;border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.15)}
        .input-field::placeholder{color:#64748b}
        .guardar-btn{width:100%;padding:14px;border-radius:10px;border:none;background:linear-gradient(90deg,#34d399,#06b6d4);color:#012;font-size:1em;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 0.2s;box-shadow:0 6px 20px rgba(6,182,212,0.12)}
        .guardar-btn:hover{opacity:0.9}
        .guardar-btn:disabled{background:#1e3a4a;color:#64748b;cursor:not-allowed;opacity:0.6}
        .gastos-list{padding:24px;overflow-y:auto;flex:1;background:#0b1220;border-radius:0 0 16px 16px}
        .gasto-item{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin-bottom:12px;transition:background 0.2s}
        .gasto-item:hover{background:rgba(255,255,255,0.05)}
        .gasto-info{display:flex;flex-direction:column;gap:8px}
        .gasto-fecha{color:#94a3b8;font-size:0.85em}
        .gasto-desc{color:#e6eef6;font-size:0.95em}
        .gasto-valor{color:#34d399;font-size:1em;font-weight:600}
        
        [data-theme="light"] .modal-backdrop{background:rgba(0,0,0,0.5)}
        [data-theme="light"] .modal-gastos{background:#ffffff;color:#000000;border:1px solid rgba(0,0,0,0.1)}
        [data-theme="light"] .gastos-header{background:#f1f5f9;border-bottom:1px solid rgba(0,0,0,0.1)}
        [data-theme="light"] .gastos-header h3{color:#000000}
        [data-theme="light"] .close-btn{color:#475569}
        [data-theme="light"] .close-btn:hover{color:#000000}
        [data-theme="light"] .gastos-form{background:#f8fafc;border-bottom:1px solid rgba(0,0,0,0.1)}
        [data-theme="light"] .form-group label{color:#1e293b;font-weight:700}
        [data-theme="light"] .input-field{background:#ffffff;border:1px solid rgba(0,0,0,0.2);color:#000000}
        [data-theme="light"] .input-field::placeholder{color:#64748b}
        [data-theme="light"] .gastos-list{background:#f1f5f9;border-radius:0 0 16px 16px}
        [data-theme="light"] .gasto-item{background:#ffffff;border:1px solid rgba(0,0,0,0.1)}
        [data-theme="light"] .gasto-item:hover{background:#f8fafc}
        [data-theme="light"] .gasto-fecha{color:#475569;font-weight:600}
        [data-theme="light"] .gasto-desc{color:#000000;font-weight:600}
        [data-theme="light"] .gasto-valor{color:#059669;font-weight:700}
      `}</style>
    </div>
  )
}
