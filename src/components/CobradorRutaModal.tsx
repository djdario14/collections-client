
import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL;

interface Cliente {
  id: string;
  nombre: string;
  deuda: number;
  vencimiento: string;
  telefono?: string;
  assignedAt?: string;
}

interface CobradorRutaModalProps {
  cobrador: {
    id: number;
    nombre: string;
    username: string;
    createdAt: string;
    adminId?: number;
  };
  onClose: () => void;
}

const CobradorRutaModal: React.FC<CobradorRutaModalProps> = ({ cobrador, onClose }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resumen, setResumen] = useState<any>(null);
  const [cobradorData, setCobradorData] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // No token, endpoint público para admin
        const res = await fetch(`${API_BASE}/api/auth/cobrador/${cobrador.id}/resumen`);
        if (!res.ok) throw new Error('No se pudo cargar el resumen');
        const data = await res.json();
        setResumen(data);
        setCobradorData(data.cobrador || cobrador);
        setClientes(data.clientes || []);
      } catch (err) {
        setError('Error al cargar el resumen y clientes de la ruta');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [cobrador.id]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 16, 33, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 200,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,40,55,0.97) 0%, rgba(20,30,45,0.97) 100%)',
        padding: '32px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#e6eef6', margin: 0, fontSize: '1.3em' }}>
            🚩 Ruta de {cobradorData?.nombre || cobrador.nombre}
          </h2>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#e6eef6',
              padding: '4px 8px'
            }}
          >
            ✕
          </button>
        </div>
        {loading ? (
          <div style={{ color: '#94a3b8', textAlign: 'center', margin: '32px 0' }}>Cargando resumen y clientes...</div>
        ) : error ? (
          <div style={{ color: 'red', background: '#1e293b', border: '1px solid #ef4444', borderRadius: 8, padding: 16, marginBottom: 16 }}>{error}</div>
        ) : (
          <>
            <div style={{ color: '#e6eef6', marginBottom: 16 }}>
              <div><b>Usuario:</b> @{cobradorData?.username}</div>
              <div><b>Registrado:</b> {cobradorData?.createdAt ? new Date(cobradorData.createdAt).toLocaleDateString() : 'N/A'}</div>
              <div><b>Estado:</b> Activo</div>
            </div>
            <div style={{ marginBottom: 24, background: '#1e293b', padding: 16, borderRadius: 12, display: 'flex', gap: 32 }}>
              <div style={{ minWidth: 180 }}>
                <div><b>Caja hoy:</b> ${resumen?.cajaHoy?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) ?? '0.00'}</div>
                <div><b>Clientes atendidos hoy:</b> {resumen?.clientesAtendidos ?? 0}</div>
                <div><b>Total clientes:</b> {resumen?.totalClientes ?? clientes.length}</div>
              </div>
            </div>
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
          </>
        )}
      </div>
    </div>
  );
};

export default CobradorRutaModal;
