import React, { useState } from 'react';
import CrearCobradorModal from './CrearCobradorModal';
import ListaCobradoresModal from './ListaCobradoresModal';

// Nuevo: importar el detalle del cobrador
import AdminDetailsModal from './AdminDetailsModal';

// Solo se requiere el tipo de props

type AdminDashboardProps = {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  user: {
    id: number;
    username: string;
    nombre: string;
    role: 'admin';
    adminId: number | null;
    token: string;
    sessionId: string;
  };
  onLogout: () => void;
};

export default function AdminDashboard({ theme, onToggleTheme, user, onLogout }: AdminDashboardProps) {
  const [showCrearCobrador, setShowCrearCobrador] = useState(false);
  const [selectedCobrador, setSelectedCobrador] = useState(null as null | { id: number, nombre: string });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', position: 'relative' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
        {!selectedCobrador ? (
          <>
            <h1 style={{ fontSize: '2em', marginBottom: 24 }}>Tus Cobradores</h1>
            <button
              onClick={() => setShowCrearCobrador(true)}
              style={{
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.2) 100%)',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                borderRadius: 12,
                padding: '16px 32px',
                cursor: 'pointer',
                color: 'var(--text-primary)',
                fontSize: '1.1em',
                fontWeight: 600,
                marginBottom: 24
              }}
            >
              ➕ Crear Cobrador
            </button>
            {/* Pasar función para seleccionar cobrador */}
            <ListaCobradoresModal 
              adminToken={user.token} 
              adminId={user.id} 
              onSelectCobrador={(cobrador) => setSelectedCobrador(cobrador)}
            />
          </>
        ) : (
          <>
            <button
              onClick={() => setSelectedCobrador(null)}
              style={{ marginBottom: 24, background: 'none', border: 'none', color: '#3b82f6', fontWeight: 600, cursor: 'pointer', fontSize: '1em' }}
            >
              ← Volver a la lista de cobradores
            </button>
            {/* Mostrar detalle del cobrador seleccionado */}
            <AdminDetailsModal 
              adminId={selectedCobrador.id} 
              token={user.token} 
              onClose={() => setSelectedCobrador(null)} 
              modoSoloCobrador={true} // para mostrar solo el detalle del cobrador
            />
          </>
        )}
      </div>
      {showCrearCobrador && (
        <CrearCobradorModal
          onClose={() => setShowCrearCobrador(false)}
          onSuccess={() => setShowCrearCobrador(false)}
          adminToken={user.token}
        />
      )}
    </div>
  );
}
