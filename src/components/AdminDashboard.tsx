
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MenuLateral from './MenuLateral';
import CrearCobradorModal from './CrearCobradorModal';
import ListaCobradoresModal from './ListaCobradoresModal';
import CobradorDetailsPanel from './CobradorDetailsPanel';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCobradores, setShowCobradores] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', position: 'relative' }}>
      {/* Botón menú 3 rayas */}
      <button
        onClick={() => setMenuOpen(true)}
        style={{
          position: 'fixed',
          top: 18,
          left: 18,
          zIndex: 1100,
          background: 'none',
          border: 'none',
          fontSize: 32,
          cursor: 'pointer',
          color: 'var(--text-primary)',
          borderRadius: 8,
          padding: 4,
        }}
        aria-label="Abrir menú"
      >
        <span style={{ fontWeight: 700 }}>&#9776;</span>
      </button>
      <MenuLateral
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onToggleTheme={onToggleTheme}
        onLogout={onLogout}
        onResumenRutas={() => { navigate('/resumen-rutas'); setMenuOpen(false); }}
        theme={theme}
      />
      {/* Contenido principal */}
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
            <ListaCobradoresModal 
              adminToken={user.token} 
              adminId={user.id} 
              onSelectCobrador={(cobrador) => setSelectedCobrador(cobrador)}
              onClose={() => setShowCobradores(false)}
            />
          </>
        ) : (
          <CobradorDetailsPanel 
            cobradorId={selectedCobrador.id} 
            nombre={selectedCobrador.nombre}
            token={user.token}
            onBack={() => setSelectedCobrador(null)}
            userRole={user.role}
          />
        )}
      </div>
      {showCrearCobrador && (
        <CrearCobradorModal
          onClose={() => setShowCrearCobrador(false)}
          onSuccess={() => setShowCrearCobrador(false)}
          adminToken={user.token}
        />
      )}
      {/* El resumen de rutas ahora es una página aparte */}
    </div>
  );
}
