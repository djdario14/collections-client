// Utilidad para determinar estado de crédito y si el cliente está al día
export function getCreditoStatus(credits, payments) {
  if (!credits || credits.length === 0) return { estado: 'Inactivo', alDia: null };
  // Buscar crédito activo (saldo > 0)
  const sorted = [...credits].sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt));
  const activo = sorted.find(cr => {
    const pagos = payments?.filter(p => p.creditId === cr.id) || [];
    const abono = pagos.reduce((sum, p) => sum + (p.amount || 0), 0);
    return abono < cr.total;
  });
  if (!activo) return { estado: 'Inactivo', alDia: null };
  // Calcular si está al día
  const pagos = payments?.filter(p => p.creditId === activo.id) || [];
  const abono = pagos.reduce((sum, p) => sum + (p.amount || 0), 0);
  const fechaInicio = new Date(activo.date || activo.createdAt);
  const hoy = new Date();
  let diasEsperados = 0;
  switch ((activo.frequency || '').toLowerCase()) {
    case 'diario': diasEsperados = Math.floor((hoy - fechaInicio) / (1000*60*60*24)); break;
    case 'semanal': diasEsperados = Math.floor((hoy - fechaInicio) / (1000*60*60*24*7)); break;
    case 'quincenal': diasEsperados = Math.floor((hoy - fechaInicio) / (1000*60*60*24*15)); break;
    case 'mensual': diasEsperados = Math.floor((hoy - fechaInicio) / (1000*60*60*24*30)); break;
    default: diasEsperados = 0;
  }
  const valorCuota = activo.valorCuota || (activo.amount ? Math.round((activo.amount * 0.04) * 100) / 100 : 0);
  const cuotasPagadas = valorCuota > 0 ? Math.floor(abono / valorCuota) : 0;
  const alDia = cuotasPagadas >= diasEsperados;
  return { estado: 'Activo', alDia };
}
