import { tryFetch } from './api';

const API_BASE = import.meta.env.VITE_API_URL;

export type ResumenRutasPeriodo = 'diario' | 'semanal' | 'mensual' | 'anual';

export async function getResumenRutas(periodo: ResumenRutasPeriodo, adminId: number) {
  // endpoint: /api/auth/admin/:adminId/resumen-rutas?periodo=diario
  return tryFetch(`${API_BASE}/api/auth/admin/${adminId}/resumen-rutas?periodo=${periodo}`);
}
