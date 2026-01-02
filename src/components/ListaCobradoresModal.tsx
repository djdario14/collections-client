import { useState, useEffect } from 'react'
import CobradorRutaModal from './CobradorRutaModal'
const API_BASE = import.meta.env.VITE_API_URL;

type Cobrador = {
  id: number
  username: string
  nombre: string
  role: 'cobrador'
  adminId?: number
  createdAt: string
}

type Props = {
  onClose: () => void
  adminToken: string
  adminId: number
  onSelectCobrador?: (cobrador: { id: number, nombre: string }) => void
}

export default function ListaCobradoresModal({ adminToken, adminId, onSelectCobrador }: Props) {
  const [cobradores, setCobradores] = useState<Cobrador[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCobrador, setSelectedCobrador] = useState<Cobrador | null>(null)
  const [error, setError] = useState<string | null>(null);

  // Menú de opciones flotante
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [editMenuOpenId, setEditMenuOpenId] = useState<number | null>(null);

  function handleRequestDelete(nombre: string) {
    setMenuOpenId(null);
    alert(`Solicitar eliminación de cobrador: ${nombre}`);
  }

  function handleEditOption(id: number, option: string) {
    setEditMenuOpenId(null);
    if (option === 'nombre') {
      alert('Cambiar nombre de ruta para cobrador ID: ' + id);
    } else if (option === 'password') {
      alert('Cambiar contraseña para cobrador ID: ' + id);
    }
  }

  useEffect(() => {
    loadCobradores()
  }, [])

  async function loadCobradores() {
    try {
      const res = await fetch(`${API_BASE}/api/auth/admin/${adminId}/cobradores`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      })
      if (res.ok) {
        const cobradores = await res.json();
        setCobradores(cobradores);
        setError(null);
      } else {
        setError('Error al cargar la lista de cobradores. Código: ' + res.status);
        setCobradores([]);
      }
    } catch (err) {
      setError('Error de conexión al cargar cobradores');
      setCobradores([]);
    } finally {
      setLoading(false);
    }
  }

  // (Eliminada función duplicada handleRequestDelete)

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
                    onSelectCobrador({ id: cobrador.id, nombre: cobrador.nombre })
                  } else {
                    setSelectedCobrador(cobrador)
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
                {/* Opciones eliminadas, solo muestra la tarjeta */}
                        onClick={e => { e.stopPropagation(); setEditMenuOpenId(cobrador.id); setMenuOpenId(null); }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        style={{
                          display: 'block', width: '100%', background: 'none', border: 'none', color: '#fca5a5', padding: '12px 16px', textAlign: 'left', cursor: 'pointer', fontSize: 15
                        }}
                        onClick={e => { e.stopPropagation(); handleRequestDelete(cobrador.nombre); }}
                      >
                        🗑️ Solicitar Eliminación
                      </button>
                    </div>
                  )}
                  {editMenuOpenId === cobrador.id && (
                    <div style={{
                      position: 'absolute',
                      right: 0,
                      top: 36,
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: 8,
                                {/* Opciones eliminadas, solo muestra la tarjeta */}
                      zIndex: 11,

                      minWidth: 220
