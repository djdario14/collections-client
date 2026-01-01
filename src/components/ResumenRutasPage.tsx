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

export default function ResumenRutasPage({ adminId }: { adminId: number }) {
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
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', paddingTop: 60 }}>
      <div style={{ width: 480, maxWidth: '95vw', background: 'var(--card)', borderRadius: 16, boxShadow: '0 4px 24px rgba(0,0,0,0.10)', padding: 32, marginTop: 32 }}>
        <h2 style={{ marginTop: 0, marginBottom: 24, fontWeight: 800, fontSize: '1.7em', textAlign: 'center', letterSpacing: 0.5 }}>Resumen de rutas</h2>
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center', gap: 12 }}>
          {PERIODOS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodo(p.key as ResumenRutasPeriodo)}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: periodo === p.key ? '2px solid #22c55e' : '1px solid #ccc',
                background: periodo === p.key ? 'rgba(34,197,94,0.12)' : 'none',
                color: periodo === p.key ? '#22c55e' : 'var(--text-primary)',
                fontWeight: periodo === p.key ? 700 : 500,
                fontSize: 16,
                cursor: 'pointer',
                transition: 'all 0.2s',
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
