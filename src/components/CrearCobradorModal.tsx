import React, { useState } from 'react'

type Props = {
  onClose: () => void
  onSuccess: () => void
  adminToken: string
}

export default function CrearCobradorModal({ onClose, onSuccess, adminToken }: Props) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    // Validación de campos vacíos
    if (!formData.nombre.trim()) {
      setError('El nombre completo es requerido')
      return
    }

    if (!formData.username.trim()) {
      setError('El usuario es requerido')
      return
    }

    if (!formData.password.trim()) {
      setError('La contraseña es requerida')
      return
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/cobrador-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        alert('✅ Solicitud enviada al SuperAdmin. Te notificaremos cuando sea aprobada.')
        onSuccess()
        onClose()
      } else {
        const data = await res.json()
        setError(data.message || 'Error al enviar solicitud')
      }
    } catch (error) {
      console.error('Error enviando solicitud:', error)
      setError('Error de conexión con el servidor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(7, 16, 33, 0.95)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(30,40,55,0.95) 0%, rgba(20,30,45,0.95) 100%)',
        padding: '32px',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '500px',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ color: '#e6eef6', margin: 0, fontSize: '1.5em' }}>
            👤 Crear Nuevo Cobrador
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

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#e6eef6',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Nombre completo
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: Juan Pérez"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#e6eef6',
                fontSize: '16px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              color: '#e6eef6',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Usuario
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="Ej: jperez"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#e6eef6',
                fontSize: '16px',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              color: '#e6eef6',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#e6eef6',
                fontSize: '16px',
                outline: 'none'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: '14px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: '1px solid rgba(100, 200, 255, 0.3)',
                background: 'rgba(15, 23, 42, 0.5)',
                color: '#94a3b8',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: '14px',
                borderRadius: '8px',
                border: 'none',
                background: loading ? '#64748b' : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                color: '#fff',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(34, 197, 94, 0.4)'
              }}
            >
              {loading ? 'Enviando solicitud...' : '📤 Enviar Solicitud'}
            </button>
          </div>
        </form>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          borderRadius: '8px',
          background: 'rgba(34, 197, 94, 0.1)',
          border: '1px solid rgba(34, 197, 94, 0.2)'
        }}>
          <p style={{
            color: '#fbbf24',
            fontSize: '13px',
            margin: 0,
            lineHeight: 1.5
          }}>
            ⏳ <strong>Proceso de aprobación:</strong><br />
            Tu solicitud será enviada al SuperAdmin quien deberá aprobarla antes de crear el cobrador.<br />
            El cobrador será automáticamente asignado a tu cuenta una vez aprobado.
          </p>
        </div>
      </div>
    </div>
  )
}
