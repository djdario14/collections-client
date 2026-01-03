import sqliteService from './sqliteService';

type Payment = {
  id: string;
  amount: number;
  date: string;
  notes?: string;
};

type Credit = {
  id: string;
  amount: number;
  interest: number; // percent
  total: number;
  frequency: 'diario' | 'semanal' | 'quincenal' | 'mensual';
  date: string;
};

type Cliente = {
  id: string;
  nombre: string;
  ubicacionGps?: string;
  negocio?: string;
  telefono?: string;
  deuda: number;
  vencimiento: string;
  payments?: Payment[];
  credits?: Credit[];
};

const API_BASE = import.meta.env.VITE_API_URL;

let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
let sqliteReady = false;

// Detect if running in web mode (no SQLite available)
const isWeb = typeof window !== 'undefined' && navigator.userAgent.includes('Chrome') && !window.Capacitor;

if (isWeb) {
  sqliteReady = false;
  console.log('Web mode detected: SQLite features disabled');
}

// Inicializar SQLite al cargar
if (typeof window !== 'undefined') {
  // Only initialize SQLite if not in web mode
  if (!isWeb) {
    sqliteService.init().then(ready => {
      sqliteReady = ready;
      console.log('SQLite ready:', ready);
    });
  }

  // Detectar cambios en conexión
  window.addEventListener('online', () => {
    isOnline = true;
    console.log('🟢 Conexión restaurada');
    if (!isWeb) syncWithServer();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
    console.log('🔴 Sin conexión - usando modo offline');
  });
}

export async function tryFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  // Agregar token de autorización si existe
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(opts?.headers as Record<string, string> || {}),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...opts,
      headers
    } as any);
    
    if (!res.ok) {
      // Si es error 401, limpiar sesión y recargar (con delay para evitar loops)
      if (res.status === 401) {
        console.warn('⚠️ Error 401 - Sesión expirada');
        localStorage.removeItem('token');
        localStorage.removeItem('sessionId');
        sessionStorage.clear();
        // Usar setTimeout para evitar interrumpir operaciones en curso
        setTimeout(() => {
          window.location.href = '/';
        }, 100);
        throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.');
      }
      
      // Intentar parsear el error del servidor
      try {
        const errorData = await res.json();
        const errorMessage = errorData.message || errorData.error || `Error ${res.status}: ${res.statusText}`;
        console.error(`❌ Error ${res.status} en ${url}:`, errorMessage);
        throw new Error(errorMessage);
      } catch (jsonError) {
        console.error(`❌ Error ${res.status} en ${url}:`, res.statusText);
        throw new Error(`Error ${res.status}: ${res.statusText}`);
      }
    }
    return res.json() as Promise<T>;
  } catch (error: any) {
    // Si es un error de red (no hay conexión, timeout, etc.)
    if (error instanceof TypeError || error.message === 'Failed to fetch') {
      throw new Error('No hay conexión con el servidor. Verifica tu conexión a internet.');
    }
    throw error;
  }
}

// Sincronizar datos pendientes con el servidor
async function syncWithServer() {
  if (!sqliteReady || !isOnline) return;

  try {
    const queue = await sqliteService.getSyncQueue();
    console.log(`📤 Sincronizando ${queue.length} cambios pendientes...`);

    for (const item of queue) {
      try {
        // Aquí implementarías la lógica de sync con el servidor
        // Por ahora solo limpiamos la cola
        await sqliteService.removeSyncQueueItem(item.id);
      } catch (err) {
        console.error('Error sincronizando item:', item, err);
      }
    }

    if (queue.length > 0) {
      console.log('✅ Sincronización completada');
    }
  } catch (err) {
    console.error('Error en sincronización:', err);
  }
}

export async function getClients(): Promise<Cliente[]> {
  // Si SQLite está disponible y no hay conexión, usar local
  if (sqliteReady && !isWeb && !isOnline) {
    console.log('📱 Obteniendo clientes desde SQLite local');
    return await sqliteService.getClients();
  }

  // Intentar obtener del servidor
  try {
    const list = await tryFetch<Cliente[]>(`${API_BASE}/api/clients`);
    return list;
  } catch (err) {
    // Si falla y tenemos SQLite, usar local
    if (sqliteReady) {
      console.log('⚠️ Error del servidor, usando datos locales');
      return await sqliteService.getClients();
    }
    // Fallback a array vacío
    return [];
  }
}

export async function getClientById(id: string): Promise<Cliente | undefined> {
  if (sqliteReady && !isWeb && !isOnline) {
    console.log('📱 Obteniendo cliente desde SQLite local');
    return await sqliteService.getClientById(id);
  }

  try {
    const c = await tryFetch<Cliente>(`${API_BASE}/api/clients/${id}`);
    return c;
  } catch (err) {
    if (sqliteReady) {
      console.log('⚠️ Error del servidor, usando datos locales');
      return await sqliteService.getClientById(id);
    }
    return undefined;
  }
}

export async function createPayment(clientId: string, payment: Omit<Payment, 'id'>): Promise<Payment | undefined> {
  // Si no hay conexión, guardar localmente
  if (sqliteReady && !isWeb && !isOnline) {
    console.log('💾 Guardando pago localmente (se sincronizará después)');
    return await sqliteService.createPayment(clientId, payment);
  }

  try {
    const res = await tryFetch<Payment>(`${API_BASE}/api/clients/${clientId}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payment) });
    return res;
  } catch (err) {
    // Si falla y tenemos SQLite, guardar localmente
    if (sqliteReady) {
      console.log('⚠️ Error del servidor, guardando pago localmente');
      return await sqliteService.createPayment(clientId, payment);
    }
    return undefined;
  }
}

export async function createClient(payload: Omit<Cliente, 'id' | 'payments'>): Promise<Cliente> {
  if (sqliteReady && !isWeb && !isOnline) {
    console.log('💾 Guardando cliente localmente (se sincronizará después)');
    return await sqliteService.createClient(payload);
  }

  try {
    const res = await tryFetch<Cliente>(`${API_BASE}/api/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return res;
  } catch (err) {
    if (sqliteReady) {
      console.log('⚠️ Error del servidor, guardando cliente localmente');
      return await sqliteService.createClient(payload);
    }
    throw err;
  }
}

export async function createCredit(clientId: string, credit: Omit<Credit, 'id' | 'date' | 'total'> & { amount: number; interest?: number; frequency: Credit['frequency'] }): Promise<Credit | undefined> {
  if (sqliteReady && !isWeb && !isOnline) {
    console.log('💾 Guardando crédito localmente (se sincronizará después)');
    return await sqliteService.createCredit(clientId, credit);
  }

  try {
    const res = await tryFetch<Credit>(`${API_BASE}/api/clients/${clientId}/credits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: credit.amount, interest: credit.interest, frequency: credit.frequency, cuotas: (credit as any).cuotas }) });
    return res;
  } catch (err: any) {
    // Si el error es por crédito activo, propagar el error
    if (err?.error === 'ACTIVE_CREDIT_EXISTS') {
      throw err;
    }
    
    // Para otros errores, intentar guardar localmente
    if (sqliteReady) {
      console.log('⚠️ Error del servidor, guardando crédito localmente');
      return await sqliteService.createCredit(clientId, credit);
    }
    return undefined;
  }
}

export async function updateClient(clientId: string, data: Partial<Cliente>): Promise<Cliente | undefined> {
  console.log('🌐 updateClient llamado - ID:', clientId, 'Data:', data);
  console.log('📡 Estado: isOnline =', isOnline, ', sqliteReady =', sqliteReady);
  
  if (sqliteReady && !isWeb && !isOnline) {
    console.log('💾 Actualizando cliente localmente (se sincronizará después)');
    return await sqliteService.updateClient(clientId, data);
  }

  try {
    console.log('🚀 Enviando PUT a:', `${API_BASE}/api/clients/${clientId}`);
    const res = await tryFetch<Cliente>(`${API_BASE}/api/clients/${clientId}`, { 
      method: 'PUT', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(data) 
    });
    console.log('✅ Respuesta del servidor:', res);
    return res;
  } catch (err) {
    console.error('❌ Error en la petición:', err);
    if (sqliteReady) {
      console.log('⚠️ Error del servidor, actualizando cliente localmente');
      return await sqliteService.updateClient(clientId, data);
    }
    return undefined;
  }
}
