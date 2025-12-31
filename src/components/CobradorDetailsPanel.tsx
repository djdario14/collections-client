import { useEffect, useState } from 'react';

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
        <div style={{ marginBottom: 24, background: '#1e293b', padding: 16, borderRadius: 12, display: 'flex', gap: 32 }}>
          <div style={{ minWidth: 180 }}>
            <div><b>Usuario:</b> {cobrador.username}</div>
            <div><b>Fecha de alta:</b> {cobrador.createdAt ? new Date(cobrador.createdAt).toLocaleDateString() : 'N/A'}</div>
            <div><b>Estado:</b> Activo</div>
          </div>
          <div>
            <div><b>Caja hoy:</b> ${resumen?.cajaHoy?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) ?? '0.00'}</div>
            <div><b>Clientes atendidos hoy:</b> {resumen?.clientesAtendidos ?? 0}</div>
            <div><b>Total clientes:</b> {resumen?.totalClientes ?? clientes.length}</div>
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
                <th style={{ padding: 8, textAlign: 'left' }}>Deuda</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Vencimiento</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Teléfono</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Asignado</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: 8 }}>{c.nombre}</td>
                  <td style={{ padding: 8 }}>${c.deuda?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: 8 }}>{c.vencimiento ? new Date(c.vencimiento).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ padding: 8 }}>{c.telefono || '-'}</td>
                  <td style={{ padding: 8 }}>{c.assignedAt ? new Date(c.assignedAt).toLocaleDateString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Aquí se puede agregar un modal para editar cobrador si showEdit es true */}
    </div>
  );
}
