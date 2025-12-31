import React, { useState } from 'react';
import CrearCobradorModal from './CrearCobradorModal';
import ListaCobradoresModal from './ListaCobradoresModal';

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

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', position: 'relative' }}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
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
        <ListaCobradoresModal adminToken={user.token} adminId={user.id} />
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
