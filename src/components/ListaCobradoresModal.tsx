  const [selectedCobrador, setSelectedCobrador] = useState<Cobrador | null>(null);
import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL;

type Cobrador = {
  id: number
  username: string
  nombre: string
  role: 'cobrador'
  adminId?: number;
  createdAt: string;
}

type Props = {
  onClose: () => void;
  adminToken: string;
  adminId: number;
  onSelectCobrador?: (cobrador: { id: number, nombre: string }) => void;
}

export default function ListaCobradoresModal({ adminToken, adminId, onSelectCobrador }: Props) {
  const [cobradores, setCobradores] = useState<Cobrador[]>([]);
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCobradores() {
      try {
        const res = await fetch(`${API_BASE}/api/auth/admin/${adminId}/cobradores`, {
          headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCobradores(data);
        } else {
          setError('Error al cargar cobradores.');
        }
      } catch (err) {
        setError('Error de conexión al cargar cobradores.');
      } finally {
        setLoading(false);
      }
    }
    loadCobradores();
  }, [adminId, adminToken]);

  return (
    <section style={{ maxWidth: 700, margin: '0 auto', padding: 32 }}>
      <h1 style={{ color: '#e6eef6', marginBottom: 24, fontSize: '2em', textAlign: 'left' }}>Tus Cobradores</h1>
      {loading && <p style={{ color: '#94a3b8' }}>Cargando cobradores...</p>}
      {error && (
        <div style={{ color: 'red', background: '#1e293b', border: '1px solid #ef4444', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {!loading && !error && (
        <>
          {cobradores.length > 0 ? (
            cobradores.map((cobrador) => (
              <div
                key={cobrador.id}
                style={{
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '12px',
                  padding: '20px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  marginBottom: 18
                }}
                onClick={() => {
                  if (onSelectCobrador) {
                    onSelectCobrador({ id: cobrador.id, nombre: cobrador.nombre });
                  } else {
                    setSelectedCobrador(cobrador);
                  }
                }}
                title="Ver detalles de la ruta"
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.5em' }}>🎯</span>
                    <div>
                      <h3 style={{
                        color: '#e6eef6',
                        margin: 0,
                        fontSize: '1.2em',
                        fontWeight: 600
                      }}>
                        {cobrador.nombre}
                      </h3>
                      <p style={{
                        color: '#94a3b8',
                        margin: '4px 0 0 0',
                        fontSize: '1em'
                      }}>
                        @{cobrador.username}
                      </p>
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '8px',
                    fontSize: '0.95em'
                  }}>
                    <span style={{
                      background: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.4)',
                      borderRadius: '12px',
                      padding: '4px 10px',
                      color: '#4ade80'
                    }}>
                      Cobrador Activo
                    </span>
                    <span style={{ color: '#64748b' }}>
                      Desde {new Date(cobrador.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {/* Tarjeta limpia, sin menú ni botones extra */}
              </div>
            ))
          ) : (
            <p style={{ color: '#94a3b8' }}>No tienes cobradores registrados.</p>
          )}
        </>
      )}
    </section>
  );
}
