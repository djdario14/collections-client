type Props = {
  onClose: () => void
  totalCobrado: number
  totalPrestado: number
  clientesConAbono: number
  totalClientes: number
  clientesNuevos: number
  gastosDelDia: number
}

export default function ResumenModal({ onClose, totalCobrado, totalPrestado, clientesConAbono, totalClientes, clientesNuevos, gastosDelDia }: Props) {
  const caja = totalCobrado - gastosDelDia

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Resumen de Cobranza</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div className="resumen-item">
            <span className="resumen-label">Total cobrado del día:</span>
            <span className="resumen-value">${totalCobrado.toLocaleString()}</span>
          </div>
          
          <div className="resumen-item">
            <span className="resumen-label">Total prestado:</span>
            <span className="resumen-value">${totalPrestado.toLocaleString()}</span>
          </div>
          
          <div className="resumen-item">
            <span className="resumen-label">Gastos:</span>
            <span className="resumen-value">${gastosDelDia.toLocaleString()}</span>
          </div>
          
          <div className="resumen-item" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
            <span className="resumen-label" style={{ fontWeight: 600, fontSize: '1.1em' }}>Caja:</span>
            <span className="resumen-value" style={{ fontWeight: 600, fontSize: '1.1em', color: '#2ecc71' }}>${caja.toLocaleString()}</span>
          </div>
          
          <div className="resumen-item">
            <span className="resumen-label">Clientes con abono:</span>
            <span className="resumen-value">{clientesConAbono} de {totalClientes}</span>
          </div>
          
          <div className="resumen-item">
            <span className="resumen-label">Clientes nuevos del día:</span>
            <span className="resumen-value">{clientesNuevos}</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button onClick={onClose} className="primary" style={{ flex: 1 }}>Cerrar</button>
        </div>
      </div>
      <style>{`
        .modal-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:150;pointer-events:auto;background:#071021}
        .modal{pointer-events:auto;background:#0b1a2a;padding:24px;border-radius:12px;width:500px;color:#e6eef6;box-shadow:0 8px 30px rgba(2,6,23,0.6);border:1px solid rgba(255,255,255,0.03)}
        .modal h3{margin:0 0 12px;font-size:1.4em}
        .resumen-item{display:flex;justify-content:space-between;align-items:center;padding:8px 0}
        .resumen-label{color:#64748b;font-size:0.95em;font-weight:700}
        .resumen-value{color:#e6eef6;font-size:1.05em;font-weight:600}
        
        [data-theme="light"] .modal-backdrop{background:rgba(0,0,0,0.5)}
        [data-theme="light"] .modal{background:#ffffff;color:#000000;border:1px solid rgba(0,0,0,0.1)}
        [data-theme="light"] .modal h3{color:#000000}
        [data-theme="light"] .resumen-label{color:#1e293b;font-weight:700}
        [data-theme="light"] .resumen-value{color:#000000;font-weight:700}
      `}</style>
    </div>
  )
}
