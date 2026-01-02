import { useEffect, useState } from 'react';
import ClientDetailModal from './ClientDetailModal';
import { getCreditoStatus } from './creditoStatusUtils';

const API_BASE = import.meta.env.VITE_API_URL;

type Cliente = {
  id: string;
  nombre: string;
  deuda: number;
  vencimiento: string;
  telefono?: string;
  assignedAt?: string;
  payments?: any[];
  credits?: any[];
  createdAt?: string;
};

type Props = {
  cobradorId: number;
  token: string;
  onBack: () => void;
  nombre: string;
};

export default function CobradorDetailsPanel({ cobradorId, token, onBack, nombre }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<any>(null);
  const [cobrador, setCobrador] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<string|null>(null);


  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Obtener resumen completo del cobrador (incluye datos y clientes)
        const resResumen = await fetch(`${API_BASE}/api/auth/cobrador/${cobradorId}/resumen`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const resumenData = resResumen.ok ? await resResumen.json() : null;
        setResumen(resumenData);
        setCobrador(resumenData?.cobrador || null);
        // Mostrar todos los clientes asignados al cobrador
        setClientes(resumenData?.clientes || []);
      } catch (err) {
        setError('Error al cargar los datos del cobrador');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [cobradorId, token]);

  if (loading) return <div style={{textAlign:'center',marginTop:80}}>Cargando...</div>;
  if (error) return <div style={{color:'red',textAlign:'center',marginTop:80}}>{error}</div>;

  return (
    <div>
      <button onClick={onBack} style={{ marginBottom: 24, background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: '1em' }}>
        ← Volver a la lista de cobradores
      </button>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: '1.5em', margin: 0 }}>{cobrador?.nombre || nombre}</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ background: '#334155', color: '#e0e7ef', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>✏️ Editar</button>
          <button style={{ background: '#334155', color: '#e0e7ef', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>🔑 Cambiar contraseña</button>
          <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}>🗑️ Solicitar eliminación</button>
        </div>
      </div>
      {cobrador && (
        <div style={{ marginBottom: 24, display: 'flex', gap: 24 }}>
          <div style={{ background: '#334155', color: '#e0e7ef', borderRadius: 12, padding: '24px 32px', minWidth: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px #0002' }}>
            <span style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Editar cobrador</span>
            <button style={{ background: '#60a5fa', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 16, cursor: 'pointer' }}>✏️ Editar</button>
          </div>
          <div style={{ background: '#334155', color: '#e0e7ef', borderRadius: 12, padding: '24px 32px', minWidth: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px #0002' }}>
            <span style={{ fontSize: 22, fontWeight: 600, marginBottom: 12 }}>Estadísticas de ruta</span>
            <button style={{ background: '#22d3ee', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 16, cursor: 'pointer' }}>📊 Ver estadísticas</button>
          </div>
        </div>
      )}
      <h3 style={{ marginBottom: 12 }}>Clientes asignados</h3>
      <div style={{ display: 'grid', gap: 12 }}>
        {clientes.length === 0 ? (
          <div style={{ color: '#94a3b8' }}>No hay clientes asignados</div>
        ) : (
          <table style={{ width: '100%', background: '#0f172a', borderRadius: 8, borderCollapse: 'collapse', color: '#e0e7ef' }}>
            <thead>
              <tr style={{ background: '#1e293b' }}>
                <th style={{ padding: 8, borderRadius: 8, textAlign: 'left' }}>Nombre</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Estado crédito</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Al día</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => {
                const status = getCreditoStatus(c.credits, c.payments);
                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid #334155', cursor: 'pointer' }}
                    onClick={() => setSelectedClientId(c.id)}
                    title="Ver detalle del cliente"
                  >
                    <td style={{ padding: 8 }}>{c.nombre}</td>
                    <td style={{ padding: 8 }}>{status.estado}</td>
                    <td style={{ padding: 8, textAlign: 'center' }}>
                      {status.alDia === null ? '-' : status.alDia ? <span style={{color:'#22c55e',fontWeight:700}} title="Al día">✔️</span> : <span style={{color:'#ef4444',fontWeight:700}} title="Atrasado">❌</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* Modal de detalle de cliente */}
      {selectedClientId && (
        <ClientDetailModal clientId={selectedClientId} onClose={() => setSelectedClientId(null)} />
      )}
    </div>
  );
}
