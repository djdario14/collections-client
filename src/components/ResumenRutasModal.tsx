import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { getResumenRutas, ResumenRutasPeriodo } from '../services/resumenRutas';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const PERIODOS = [
  { key: 'diario', label: 'Diario' },
  { key: 'semanal', label: 'Semanal' },
  { key: 'mensual', label: 'Mensual' },
  { key: 'anual', label: 'Anual' },
];

export default function ResumenRutasModal({ onClose, adminId }: { onClose: () => void, adminId: number }) {
  const [periodo, setPeriodo] = useState<ResumenRutasPeriodo>('diario');
  const [labels, setLabels] = useState<string[]>([]);
  const [values, setValues] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getResumenRutas(periodo, adminId)
      .then((data) => {
        setLabels(data.labels);
        setValues(data.values);
        setLoading(false);
      })
      .catch((err) => {
        setError('No se pudo cargar el resumen.');
        setLoading(false);
      });
  }, [periodo, adminId]);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000
    }}>
      <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 420, minHeight: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.12)' }}>
        <button onClick={onClose} style={{ float: 'right', fontSize: 22, border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
        <h2 style={{ marginTop: 0 }}>Resumen de rutas</h2>
        <div style={{ marginBottom: 18 }}>
          {PERIODOS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key as ResumenRutasPeriodo)}
              style={{
                marginRight: 8,
                padding: '6px 16px',
                borderRadius: 8,
                border: periodo === p.key ? '2px solid #22c55e' : '1px solid #ccc',
                background: periodo === p.key ? 'rgba(34,197,94,0.12)' : 'none',
                color: '#222',
                fontWeight: periodo === p.key ? 700 : 400,
                cursor: 'pointer',
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>Cargando...</div>
        ) : error ? (
          <div style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>{error}</div>
        ) : (
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: 'Total cobrado',
                  data: values,
                  borderColor: '#22c55e',
                  backgroundColor: 'rgba(34,197,94,0.2)',
                  tension: 0.3,
                  fill: true,
                  pointRadius: 4,
                  pointBackgroundColor: '#22c55e',
                }
              ]
            }}
            options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                tooltip: { enabled: true },
              },
              scales: {
                y: { beginAtZero: true },
              },
            }}
          />
        )}
      </div>
    </div>
  );
}
