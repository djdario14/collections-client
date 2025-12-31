import React, { useEffect, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL;

type Cliente = {
  id: string;
  nombre: string;
  deuda: number;
  vencimiento: string;
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

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // Obtener clientes del cobrador
        const resClientes = await fetch(`${API_BASE}/api/cobrador/${cobradorId}/clientes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const clientesData = resClientes.ok ? await resClientes.json() : [];
        setClientes(clientesData);

        // Obtener resumen/caja del cobrador
        const resResumen = await fetch(`${API_BASE}/api/cobrador/${cobradorId}/resumen`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const resumenData = resResumen.ok ? await resResumen.json() : null;
        setResumen(resumenData);
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
      <h2 style={{fontSize:'1.5em',marginBottom:16}}>{nombre}</h2>
      {resumen && (
        <div style={{marginBottom:32,background:'#1e293b',padding:16,borderRadius:12}}>
          <div><b>Caja hoy:</b> ${resumen.cajaHoy?.toLocaleString('es-MX', {minimumFractionDigits:2}) ?? '0.00'}</div>
          <div><b>Clientes atendidos hoy:</b> {resumen.clientesAtendidos ?? 0}</div>
          <div><b>Total clientes:</b> {resumen.totalClientes ?? clientes.length}</div>
        </div>
      )}
      <h3 style={{marginBottom:12}}>Clientes asignados</h3>
      <div style={{display:'grid',gap:12}}>
        {clientes.length === 0 ? (
          <div style={{color:'#94a3b8'}}>No hay clientes asignados</div>
        ) : clientes.map(c => (
          <div key={c.id} style={{background:'#0f172a',border:'1px solid #334155',borderRadius:8,padding:12}}>
            <div style={{fontWeight:600}}>{c.nombre}</div>
            <div>Deuda: ${c.deuda.toLocaleString('es-MX', {minimumFractionDigits:2})}</div>
            <div>Vencimiento: {c.vencimiento ? new Date(c.vencimiento).toLocaleDateString() : 'N/A'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
