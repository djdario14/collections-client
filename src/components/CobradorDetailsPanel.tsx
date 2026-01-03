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
  userRole?: string;
};

export default function CobradorDetailsPanel({ cobradorId, token, onBack, nombre, userRole }: Props) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<any>(null);
  const [cobrador, setCobrador] = useState<any>(null);
  const [selectedClientId, setSelectedClientId] = useState<string|null>(null);
  const [showEditOptions, setShowEditOptions] = useState(false);


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
      </div>
      {cobrador && (
        <div style={{ marginBottom: 24, display: 'flex', gap: 24 }}>
          {userRole === 'admin' || userRole === 'superadmin' ? (
            <div style={{ background: '#334155', color: '#e0e7ef', borderRadius: 12, padding: '24px 32px', minWidth: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px #0002', position: 'relative' }}>
              <div style={{
                width: '100%',
                background: '#334155',
                color: '#e0e7ef',
                fontWeight: 600,
                fontSize: 22,
                marginBottom: 18,
                textAlign: 'left',
                padding: '0 0 8px 0',
                borderBottom: '2px solid #475569',
                letterSpacing: 0.2,
              }}>
                Editar cobrador
              </div>
              <button
                style={{
                  background: '#22d3ee', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 18, cursor: 'pointer', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
                  boxShadow: '0 2px 8px #0001', transition: 'background 0.2s', minWidth: 170, justifyContent: 'center'
                }}
                onClick={() => setShowEditOptions(v => !v)}
              >
                <span style={{fontSize:20,marginRight:6}}>✏️</span> Editar
              </button>
              {showEditOptions && (
                <div style={{ marginTop: 8, width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button style={{ background: '#60a5fa', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    ✏️ Cambiar nombre
                  </button>
                  <button style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🔑 Cambiar contraseña
                  </button>
                  <button style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                    🗑️ Solicitar eliminación
                  </button>
                </div>
              )}
            </div>
          ) : null}
          <div style={{ background: '#334155', color: '#e0e7ef', borderRadius: 12, padding: '24px 32px', minWidth: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 2px 8px #0002' }}>
            <div style={{
              width: '100%',
              background: '#334155',
              color: '#e0e7ef',
              fontWeight: 600,
              fontSize: 22,
              marginBottom: 18,
              textAlign: 'left',
              padding: '0 0 8px 0',
              borderBottom: '2px solid #475569',
              letterSpacing: 0.2,
            }}>
              Estadísticas de ruta
            </div>
            <button style={{
              background: '#22d3ee', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600,
              boxShadow: '0 2px 8px #0001', transition: 'background 0.2s', minWidth: 170, justifyContent: 'center'
            }}>
              <span style={{fontSize:20,marginRight:6}}>📊</span> Ver estadísticas
            </button>
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
