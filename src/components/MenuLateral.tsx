import React from 'react';

interface MenuLateralProps {
  onToggleTheme: () => void;
  onLogout: () => void;
  onResumenRutas: () => void;
  theme: 'dark' | 'light';
  open: boolean;
  onClose: () => void;
}

export default function MenuLateral({ onToggleTheme, onLogout, onResumenRutas, theme, open, onClose }: MenuLateralProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: open ? 0 : -260,
      width: 260,
      height: '100vh',
      background: 'var(--bg-secondary)',
      color: 'var(--text-primary)',
      boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
      zIndex: 1000,
      transition: 'left 0.25s',
      display: 'flex',
      flexDirection: 'column',
      padding: 24
    }}>
      <button onClick={onClose} style={{ alignSelf: 'flex-end', background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: 'var(--text-primary)' }}>×</button>
      <h2 style={{ marginTop: 0, marginBottom: 32, fontWeight: 700 }}>Menú</h2>
      <button onClick={onToggleTheme} style={{ marginBottom: 18, padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
        Cambiar a tema {theme === 'dark' ? 'claro' : 'oscuro'}
      </button>
      <button onClick={onResumenRutas} style={{ marginBottom: 18, padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
        Resumen de rutas
      </button>
      <button onClick={onLogout} style={{ marginTop: 'auto', padding: 10, borderRadius: 8, border: '1px solid var(--border-color)', background: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
        Cerrar sesión
      </button>
    </div>
  );
}
