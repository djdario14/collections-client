import React from 'react';

interface CobradorRutaModalProps {
  cobrador: {
    id: number;
    nombre: string;
    username: string;
    createdAt: string;
    // Puedes agregar más campos según la info de la ruta
  };
  onClose: () => void;
}

const CobradorRutaModal: React.FC<CobradorRutaModalProps> = ({ cobrador, onClose }) => {
  // Aquí podrías hacer un fetch para traer la info de la ruta si es necesario
  // Por ahora solo muestra la info básica del cobrador
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
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#e6eef6', margin: 0, fontSize: '1.3em' }}>
            🚩 Ruta de {cobrador.nombre}
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
        <div style={{ color: '#e6eef6', marginBottom: 16 }}>
          <div><b>Usuario:</b> @{cobrador.username}</div>
          <div><b>Registrado:</b> {new Date(cobrador.createdAt).toLocaleDateString()}</div>
          {/* Aquí puedes mostrar más info de la ruta */}
        </div>
        <div style={{ color: '#60a5fa', fontSize: 13 }}>
          Aquí se mostrará la información detallada de la ruta y clientes asignados a este cobrador.
        </div>
      </div>
    </div>
  );
};

export default CobradorRutaModal;
