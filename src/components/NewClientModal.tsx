import React, { useEffect, useState } from 'react'
import { createClient } from '../services/api'

type Props = {
  onClose: () => void
  onClientCreated?: (client?: any) => void
}

export default function NewClientModal({ onClose, onClientCreated }: Props) {
  const [nombre, setNombre] = useState('')
  const [identificacion, setIdentificacion] = useState('')
  const [ubicacionGps, setUbicacionGps] = useState('')
  const [negocio, setNegocio] = useState('')
  const [codigoPais, setCodigoPais] = useState('+593')
  const [telefono, setTelefono] = useState('')
  const [posicionRuta, setPosicionRuta] = useState<number | null>(null)
  const [geoError, setGeoError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6)
        const lng = pos.coords.longitude.toFixed(6)
        setUbicacionGps(`${lat},${lng}`)
        setGeoError(null)
      },
      (err) => {
        setGeoError(err.message)
      },
      { enableHighAccuracy: false, timeout: 5000 }
    )
  }, [])

  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización')
      return
    }
    setGeoError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6)
        const lng = pos.coords.longitude.toFixed(6)
        setUbicacionGps(`${lat},${lng}`)
        setGeoError(null)
      },
      (err) => {
        setGeoError(`Error: ${err.message}. Por favor permite el acceso a la ubicación en la configuración del navegador.`)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return alert('Nombre requerido')
    setLoading(true)
    
    try {
      // Combinar código de país con teléfono
      const telefonoCompleto = telefono.trim() ? `${codigoPais}${telefono.trim()}` : ''
      
      console.log('📝 Creando cliente con datos:', { nombre: nombre.trim(), identificacion, ubicacionGps, negocio, telefono: telefonoCompleto })
      
      const created = await createClient({ nombre: nombre.trim(), identificacion, deuda: 0, vencimiento: '', ubicacionGps, direccion: '', negocio, telefono: telefonoCompleto })
      
      console.log('✅ Cliente creado:', created)
      
      if (!created || !created.id) {
        console.error('❌ Cliente creado pero sin ID:', created)
        throw new Error('No se pudo crear el cliente - ID no retornado')
      }
      
      console.log('✅ Cliente creado exitosamente con ID:', created.id)
      
      // Si se seleccionó una posición en la ruta, actualizarla
      if (posicionRuta !== null) {
        const rutaGuardada = localStorage.getItem('rutaClientes')
        if (rutaGuardada) {
          try {
            const ruta = JSON.parse(rutaGuardada)
            // Insertar en la posición seleccionada
            ruta.splice(posicionRuta, 0, {
              orden: posicionRuta + 1,
              clienteId: created.id,
              nombre: created.nombre,
              deuda: created.deuda
            })
            // Reordenar todos los números de orden
            ruta.forEach((item: any, idx: number) => {
              item.orden = idx + 1
            })
            localStorage.setItem('rutaClientes', JSON.stringify(ruta))
          } catch (e) {
            console.error('Error al actualizar ruta:', e)
          }
        } else {
          // Si no hay ruta, crear una nueva con este cliente
          const nuevaRuta = [{
            orden: 1,
            clienteId: created.id,
            nombre: created.nombre,
            deuda: created.deuda
          }]
          localStorage.setItem('rutaClientes', JSON.stringify(nuevaRuta))
        }
      }
      
      onClientCreated && onClientCreated(created)
      onClose()
    } catch (error: any) {
      console.error('Error creando cliente:', error)
      alert(error?.message || 'Error al crear el cliente. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h3>Registrar nuevo cliente</h3>
        <form onSubmit={submit}>
          <label>
            Nombre
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
          <label>
            Identificación
            <input value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} />
          </label>
          <label>
            Ubicación GPS
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={ubicacionGps} onChange={(e) => setUbicacionGps(e.target.value)} placeholder="lat,lng" style={{ flex: 1 }} />
              <button type="button" onClick={requestLocation} style={{ padding: '8px 12px', borderRadius: 8, background: '#1e90ff', border: 'none', color: 'white', cursor: 'pointer', whiteSpace: 'nowrap' }}>📍 Usar mi ubicación</button>
            </div>
          </label>
          <label>
            Negocio
            <input value={negocio} onChange={(e) => setNegocio(e.target.value)} />
          </label>
          <label>
            Teléfono
            <div style={{ display: 'flex', gap: 8 }}>
              <select 
                value={codigoPais} 
                onChange={(e) => setCodigoPais(e.target.value)}
                style={{ 
                  padding: '10px 12px', 
                  borderRadius: 8, 
                  border: '2px solid rgba(255,255,255,0.2)', 
                  background: 'rgba(30,40,55,0.8)', 
                  color: '#ffffff',
                  cursor: 'pointer',
                  minWidth: '120px',
                  fontSize: '1.05em',
                  fontWeight: 700
                }}
              >
                <option value="+593" style={{ background: '#1a2332', color: '#e6eef6' }}>🇪🇨 +593</option>
                <option value="+1" style={{ background: '#1a2332', color: '#e6eef6' }}>🇺🇸 +1</option>
                <option value="+34" style={{ background: '#1a2332', color: '#e6eef6' }}>🇪🇸 +34</option>
                <option value="+52" style={{ background: '#1a2332', color: '#e6eef6' }}>🇲🇽 +52</option>
                <option value="+57" style={{ background: '#1a2332', color: '#e6eef6' }}>🇨🇴 +57</option>
                <option value="+51" style={{ background: '#1a2332', color: '#e6eef6' }}>🇵🇪 +51</option>
                <option value="+54" style={{ background: '#1a2332', color: '#e6eef6' }}>🇦🇷 +54</option>
                <option value="+56" style={{ background: '#1a2332', color: '#e6eef6' }}>🇨🇱 +56</option>
              </select>
              <input 
                value={telefono} 
                onChange={(e) => setTelefono(e.target.value)} 
                placeholder="Número sin código de país"
                style={{ flex: 1 }}
                type="tel"
              />
            </div>
          </label>
          <label>
            Posición en ruta (opcional)
            <select 
              value={posicionRuta === null ? '' : posicionRuta} 
              onChange={(e) => setPosicionRuta(e.target.value === '' ? null : parseInt(e.target.value))}
              style={{ 
                width: '100%',
                padding: '12px 16px', 
                borderRadius: 10, 
                border: '2px solid rgba(100,200,255,0.3)', 
                background: 'linear-gradient(135deg, rgba(30,40,55,0.95) 0%, rgba(20,30,45,0.95) 100%)', 
                color: '#e6eef6',
                cursor: 'pointer',
                fontSize: '1.02em',
                fontWeight: 500,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                transition: 'all 0.2s ease',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(100,200,255,0.6)'
                e.target.style.boxShadow = '0 4px 12px rgba(100,200,255,0.2)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(100,200,255,0.3)'
                e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              <option value="" style={{ background: '#1a2332', color: '#94a3b8', fontStyle: 'italic' }}>
                ➖ No agregar a ruta ahora
              </option>
              {(() => {
                const rutaGuardada = localStorage.getItem('rutaClientes')
                if (!rutaGuardada) return (
                  <option value="0" style={{ background: '#1a2332', color: '#e6eef6' }}>
                    🥇 Primera posición
                  </option>
                )
                try {
                  const ruta = JSON.parse(rutaGuardada)
                  return (
                    <>
                      {ruta.map((_: any, idx: number) => (
                        <option key={idx} value={idx} style={{ background: '#1a2332', color: '#e6eef6' }}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📍'} Posición {idx + 1} → antes de {ruta[idx]?.nombre || 'cliente'}
                        </option>
                      ))}
                      <option value={ruta.length} style={{ background: '#1a2332', color: '#e6eef6' }}>
                        🏁 Última posición → después de {ruta[ruta.length - 1]?.nombre || 'último cliente'}
                      </option>
                    </>
                  )
                } catch {
                  return (
                    <option value="0" style={{ background: '#1a2332', color: '#e6eef6' }}>
                      🥇 Primera posición
                    </option>
                  )
                }
              })()}
            </select>
          </label>
          {/* removed Deuda inicial and Vencimiento per request; defaults applied on submit */}
          {geoError && <div style={{ color: '#ffb4b4', marginTop: 8 }}>No se pudo obtener la ubicación: {geoError}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button type="button" onClick={onClose} className="ghost">Cancelar</button>
            <button type="submit" className="primary" disabled={loading}>{loading ? 'Guardando...' : 'Crear cliente'}</button>
          </div>
        </form>
      </div>
      <style>{`
        /* non-transparent backdrop: keep underlying page hidden while modal is open */
        .modal-backdrop{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:150;pointer-events:auto;background:#071021}
        .modal{pointer-events:auto;background:#0b1a2a;padding:18px;border-radius:12px;width:420px;color:#e6eef6;box-shadow:0 8px 30px rgba(2,6,23,0.6);border:1px solid rgba(255,255,255,0.03)}
        .modal h3{margin:0 0 12px}
        .modal label{display:block;color:#e6eef6;margin-bottom:8px}
        .modal input,.modal textarea{width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.04);background:transparent;color:#e6eef6}
      `}</style>
    </div>
  )
}
