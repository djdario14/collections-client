
import { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const API_BASE = import.meta.env.VITE_API_URL;

export default function EstadisticasRutaModal({ onClose, cobradorId, token }: { onClose: () => void, cobradorId: number, token: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [labels, setLabels] = useState<string[]>([]);
  const [ingresos, setIngresos] = useState<number[]>([]);
  const [gastos, setGastos] = useState<number[]>([]);
  const [prestamos, setPrestamos] = useState<number[]>([]);
  const [periodo, setPeriodo] = useState<'diario'|'semanal'|'mensual'|'anual'>('mensual');

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${API_BASE}/api/auth/cobrador/${cobradorId}/resumen?periodo=${periodo}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Error al obtener estadísticas');
        // Ingresos (pagos)
        setLabels(data.grafico.labels);
        setIngresos(data.grafico.values);
        // Gastos y préstamos (simulados, reemplaza por datos reales si tienes)
        setGastos(data.grafico.labels.map(() => Math.floor(Math.random()*500)));
        setPrestamos(data.grafico.labels.map(() => Math.floor(Math.random()*1000)));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [cobradorId, token, periodo]);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Ingresos',
        data: ingresos,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        pointBackgroundColor: '#22c55e',
        pointBorderColor: '#22c55e',
        tension: 0.4,
      },
      {
        label: 'Gastos',
        data: gastos,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.1)',
        pointBackgroundColor: '#ef4444',
        pointBorderColor: '#ef4444',
        tension: 0.4,
      },
      {
        label: 'Préstamos',
        data: prestamos,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        pointBackgroundColor: '#3b82f6',
        pointBorderColor: '#3b82f6',
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#e0e7ef', font: { size: 16 } },
      },
      title: {
        display: true,
        text: 'Contabilidad mensual del cobrador',
        color: '#e0e7ef',
        font: { size: 22, weight: 'bold' },
        padding: { bottom: 18 },
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: $${context.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#e0e7ef', font: { size: 16 } },
        grid: { color: '#475569' },
      },
      y: {
        ticks: { color: '#e0e7ef', font: { size: 16 } },
        grid: { color: '#475569' },
      },
    },
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#334155', borderRadius: 18, padding: 32, minWidth: 600, boxShadow: '0 4px 24px #0006', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#e0e7ef', fontSize: 28, cursor: 'pointer' }}>×</button>
        <div style={{ marginBottom: 24, textAlign: 'center' }}>
          <label style={{ color: '#e0e7ef', fontWeight: 600, fontSize: 18, marginRight: 12 }}>Periodo:</label>
          <select value={periodo} onChange={e => setPeriodo(e.target.value as any)} style={{ fontSize: 16, padding: '6px 12px', borderRadius: 8, border: '1px solid #475569', background: '#1e293b', color: '#e0e7ef' }}>
            <option value="diario">Diario</option>
            <option value="semanal">Semanal</option>
            <option value="mensual">Mensual</option>
            <option value="anual">Anual</option>
          </select>
        </div>
        {loading ? (
          <div style={{ color: '#e0e7ef', textAlign: 'center', padding: 40 }}>Cargando estadísticas...</div>
        ) : error ? (
          <div style={{ color: '#ef4444', textAlign: 'center', padding: 40 }}>{error}</div>
        ) : (
          <Line data={chartData} options={options as any} height={320} />
        )}
      </div>
    </div>
  );
}
