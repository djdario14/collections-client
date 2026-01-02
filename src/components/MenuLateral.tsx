
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
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: open ? 0 : -320,
        width: 300,
        height: '100vh',
        background: 'var(--card)',
        color: 'var(--text-primary)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
        zIndex: 1000,
        transition: 'left 0.25s',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        borderRight: '1.5px solid var(--border)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '24px 24px 0 24px' }}>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', fontSize: 28, cursor: 'pointer', color: 'var(--text-primary)', marginLeft: 8 }}
          aria-label="Cerrar menú"
        >
          ×
        </button>
      </div>
      <h2 style={{ margin: '24px 0 32px 0', fontWeight: 800, fontSize: '1.7em', textAlign: 'left', paddingLeft: 32, letterSpacing: 0.5 }}>Menú</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '0 32px' }}>
        <button
          onClick={onToggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 18,
            fontWeight: 600,
            border: 'none',
            background: 'var(--glass)',
            color: 'var(--text-primary)',
            borderRadius: 10,
            padding: '14px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <span role="img" aria-label="tema">{theme === 'dark' ? '🌞' : '🌙'}</span>
          Cambiar a tema {theme === 'dark' ? 'claro' : 'oscuro'}
        </button>
        <button
          onClick={onResumenRutas}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 18,
            fontWeight: 600,
            border: 'none',
            background: 'var(--glass)',
            color: 'var(--text-primary)',
            borderRadius: 10,
            padding: '14px 18px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          <span role="img" aria-label="gráfico">📈</span>
          Resumen de rutas
        </button>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: 32 }}>
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            fontSize: 18,
            fontWeight: 700,
            border: 'none',
            background: 'linear-gradient(90deg,#ef4444,#f87171)',
            color: '#fff',
            borderRadius: 10,
            padding: '14px 0',
            boxShadow: '0 2px 12px rgba(239,68,68,0.10)',
            cursor: 'pointer',
            transition: 'background 0.2s',
            letterSpacing: 0.5,
          }}
        >
          <span role="img" aria-label="salir">🚪</span>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
