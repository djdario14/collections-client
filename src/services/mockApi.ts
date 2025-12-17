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

const clients: Cliente[] = [
  { id: 'C-001', nombre: 'Empresa Alfa', deuda: 12500, vencimiento: '2025-12-10', payments: [], credits: [] },
  { id: 'C-002', nombre: 'Comercial Beta', deuda: 4200, vencimiento: '2025-12-05', payments: [], credits: [] },
  { id: 'C-003', nombre: 'Servicios Gamma', deuda: 780, vencimiento: '2025-11-30', payments: [], credits: [] },
];

function delay<T>(v: T, ms = 200) {
  return new Promise<T>((res) => setTimeout(() => res(v), ms));
}

const API_BASE = (typeof window !== 'undefined' && window.location) ? `${window.location.origin}/api` : '/api';

async function tryFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts as any);
  if (!res.ok) throw new Error('Network error');
  return res.json() as Promise<T>;
}

export async function getClients(): Promise<Cliente[]> {
  try {
    const list = await tryFetch<Cliente[]>(`${API_BASE}/clients`);
    return list;
  } catch (err) {
    return delay(clients.map((c) => ({ ...c })));
  }
}

export async function getClientById(id: string): Promise<Cliente | undefined> {
  try {
    const c = await tryFetch<Cliente>(`${API_BASE}/clients/${id}`);
    return c;
  } catch (err) {
    const found = clients.find((c) => c.id === id);
    return delay(found ? { ...found } : undefined);
  }
}

export async function createPayment(clientId: string, payment: Omit<Payment, 'id'>): Promise<Payment | undefined> {
  try {
    const res = await tryFetch<Payment>(`${API_BASE}/clients/${clientId}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payment) });
    return res;
  } catch (err) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return delay(undefined);
    const newPayment: Payment = { id: `P-${Date.now()}`, ...payment } as Payment;
    client.payments = client.payments || [];
    client.payments.push(newPayment);
    client.deuda = Math.max(0, client.deuda - newPayment.amount);
    return delay(newPayment);
  }
}

export async function createClient(payload: Omit<Cliente, 'id' | 'payments'>): Promise<Cliente> {
  try {
    const res = await tryFetch<Cliente>(`${API_BASE}/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return res;
  } catch (err) {
    const id = `C-${String(Date.now()).slice(-6)}`;
    const newClient: Cliente = { id, payments: [], credits: [], ...payload } as Cliente;
    clients.push(newClient);
    return delay({ ...newClient });
  }
}

export async function createCredit(clientId: string, credit: Omit<Credit, 'id' | 'date' | 'total'> & { amount: number; interest?: number; frequency: Credit['frequency'] }): Promise<Credit | undefined> {
  try {
    const res = await tryFetch<Credit>(`${API_BASE}/clients/${clientId}/credits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: credit.amount, interest: credit.interest, frequency: credit.frequency }) });
    return res;
  } catch (err) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return delay(undefined);
    const interest = typeof credit.interest === 'number' ? credit.interest : 20;
    const total = Math.round((credit.amount + (credit.amount * interest) / 100) * 100) / 100;
    const newCredit: Credit = { id: `CR-${Date.now()}`, amount: credit.amount, interest, total, frequency: credit.frequency, date: new Date().toISOString().slice(0,10) };
    client.credits = client.credits || [];
    client.credits.push(newCredit);
    client.deuda = (client.deuda || 0) + newCredit.total;
    return delay(newCredit);
  }
}
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

const clients: Cliente[] = [
  { id: 'C-001', nombre: 'Empresa Alfa', deuda: 12500, vencimiento: '2025-12-10', payments: [], credits: [] },
  { id: 'C-002', nombre: 'Comercial Beta', deuda: 4200, vencimiento: '2025-12-05', payments: [], credits: [] },
  { id: 'C-003', nombre: 'Servicios Gamma', deuda: 780, vencimiento: '2025-11-30', payments: [], credits: [] },
];

function delay<T>(v: T, ms = 200) {
  return new Promise<T>((res) => setTimeout(() => res(v), ms));
}

const API_BASE = (typeof window !== 'undefined' && window.location) ? `${window.location.origin}/api` : '/api';

async function tryFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts as any);
  if (!res.ok) throw new Error('Network error');
  return res.json() as Promise<T>;
}

export async function getClients(): Promise<Cliente[]> {
  try {
    const list = await tryFetch<Cliente[]>(`${API_BASE}/clients`);
    return list;
  } catch (err) {
    return delay(clients.map((c) => ({ ...c })));
  }
}

export async function getClientById(id: string): Promise<Cliente | undefined> {
  try {
    const c = await tryFetch<Cliente>(`${API_BASE}/clients/${id}`);
    return c;
  } catch (err) {
    const found = clients.find((c) => c.id === id);
    return delay(found ? { ...found } : undefined);
  }
}

export async function createPayment(clientId: string, payment: Omit<Payment, 'id'>): Promise<Payment | undefined> {
  try {
    const res = await tryFetch<Payment>(`${API_BASE}/clients/${clientId}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payment) });
    return res;
  } catch (err) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return delay(undefined);
    const newPayment: Payment = { id: `P-${Date.now()}`, ...payment } as Payment;
    client.payments = client.payments || [];
    client.payments.push(newPayment);
    client.deuda = Math.max(0, client.deuda - newPayment.amount);
    return delay(newPayment);
  }
}

export async function createClient(payload: Omit<Cliente, 'id' | 'payments'>): Promise<Cliente> {
  try {
    const res = await tryFetch<Cliente>(`${API_BASE}/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return res;
  } catch (err) {
    const id = `C-${String(Date.now()).slice(-6)}`;
    const newClient: Cliente = { id, payments: [], credits: [], ...payload } as Cliente;
    clients.push(newClient);
    return delay({ ...newClient });
  }
}

export async function createCredit(clientId: string, credit: Omit<Credit, 'id' | 'date' | 'total'> & { amount: number; interest?: number; frequency: Credit['frequency'] }): Promise<Credit | undefined> {
  try {
    const res = await tryFetch<Credit>(`${API_BASE}/clients/${clientId}/credits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: credit.amount, interest: credit.interest, frequency: credit.frequency }) });
    return res;
  } catch (err) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return delay(undefined);
    const interest = typeof credit.interest === 'number' ? credit.interest : 20;
    const total = Math.round((credit.amount + (credit.amount * interest) / 100) * 100) / 100;
    const newCredit: Credit = { id: `CR-${Date.now()}`, amount: credit.amount, interest, total, frequency: credit.frequency, date: new Date().toISOString().slice(0,10) };
    client.credits = client.credits || [];
    client.credits.push(newCredit);
    client.deuda = (client.deuda || 0) + newCredit.total;
    return delay(newCredit);
  }
}
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

const clients: Cliente[] = [
  { id: 'C-001', nombre: 'Empresa Alfa', deuda: 12500, vencimiento: '2025-12-10', payments: [], credits: [] },
  { id: 'C-002', nombre: 'Comercial Beta', deuda: 4200, vencimiento: '2025-12-05', payments: [], credits: [] },
  { id: 'C-003', nombre: 'Servicios Gamma', deuda: 780, vencimiento: '2025-11-30', payments: [], credits: [] },
];

function delay<T>(v: T, ms = 200) {
  return new Promise<T>((res) => setTimeout(() => res(v), ms));
}

const API_BASE = (typeof window !== 'undefined' && window.location) ? `${window.location.origin}/api` : '/api';

async function tryFetch<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, opts as any);
  if (!res.ok) throw new Error('Network error');
  return res.json() as Promise<T>;
}

export async function getClients(): Promise<Cliente[]> {
  // try API first
  try {
    const list = await tryFetch<Cliente[]>(`${API_BASE}/clients`);
    return list;
  } catch (err) {
    return delay(clients.map((c) => ({ ...c })));
  }
}

export async function getClientById(id: string): Promise<Cliente | undefined> {
  try {
    const c = await tryFetch<Cliente>(`${API_BASE}/clients/${id}`);
    return c;
  } catch (err) {
    const found = clients.find((c) => c.id === id);
    return delay(found ? { ...found } : undefined);
  }
}

export async function createPayment(clientId: string, payment: Omit<Payment, 'id'>): Promise<Payment | undefined> {
  try {
    const res = await tryFetch<Payment>(`${API_BASE}/clients/${clientId}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payment) });
    return res;
  } catch (err) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return delay(undefined);
    const newPayment: Payment = { id: `P-${Date.now()}`, ...payment } as Payment;
    client.payments = client.payments || [];
    client.payments.push(newPayment);
    client.deuda = Math.max(0, client.deuda - newPayment.amount);
    return delay(newPayment);
  }
}

export async function createClient(payload: Omit<Cliente, 'id' | 'payments'>): Promise<Cliente> {
  try {
    const res = await tryFetch<Cliente>(`${API_BASE}/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return res;
  } catch (err) {
    const id = `C-${String(Date.now()).slice(-6)}`;
    const newClient: Cliente = { id, payments: [], credits: [], ...payload } as Cliente;
    clients.push(newClient);
    return delay({ ...newClient });
  }
}

export async function createCredit(clientId: string, credit: Omit<Credit, 'id' | 'date' | 'total'> & { amount: number; interest?: number; frequency: Credit['frequency'] }): Promise<Credit | undefined> {
  try {
    const res = await tryFetch<Credit>(`${API_BASE}/clients/${clientId}/credits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: credit.amount, interest: credit.interest, frequency: credit.frequency }) });
    return res;
  } catch (err) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return delay(undefined);
    const interest = typeof credit.interest === 'number' ? credit.interest : 20;
    const total = Math.round((credit.amount + (credit.amount * interest) / 100) * 100) / 100;
    const newCredit: Credit = { id: `CR-${Date.now()}`, amount: credit.amount, interest, total, frequency: credit.frequency, date: new Date().toISOString().slice(0,10) };
    client.credits = client.credits || [];
    client.credits.push(newCredit);
    client.deuda = (client.deuda || 0) + newCredit.total;
    return delay(newCredit);
  }
}
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

const clients: Cliente[] = [
  { id: 'C-001', nombre: 'Empresa Alfa', deuda: 12500, vencimiento: '2025-12-10', payments: [], credits: [] },
  { id: 'C-002', nombre: 'Comercial Beta', deuda: 4200, vencimiento: '2025-12-05', payments: [], credits: [] },
  { id: 'C-003', nombre: 'Servicios Gamma', deuda: 780, vencimiento: '2025-11-30', payments: [], credits: [] },
];

function delay<T>(v: T, ms = 200) {
  return new Promise<T>((res) => setTimeout(() => res(v), ms));
}

const API_BASE = (typeof window !== 'undefined' && window.location) ? `${window.location.origin}/api` : '/api';

export async function getClients(): Promise<Cliente[]> {
  // try API first
  try {
    const list = await tryFetch<Cliente[]>(`${API_BASE}/clients`);
    return list;
  } catch (err) {
    return delay(clients.map((c) => ({ ...c })));
  }
}

export async function getClientById(id: string): Promise<Cliente | undefined> {
  try {
    const c = await tryFetch<Cliente>(`${API_BASE}/clients/${id}`);
    return c;
  } catch (err) {
    const found = clients.find((c) => c.id === id);
    return delay(found ? { ...found } : undefined);
  }
}

export async function createPayment(clientId: string, payment: Omit<Payment, 'id'>): Promise<Payment | undefined> {
  try {
    const res = await tryFetch<Payment>(`${API_BASE}/clients/${clientId}/payments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payment) });
    return res;
  } catch (err) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return delay(undefined);
    const newPayment: Payment = { id: `P-${Date.now()}`, ...payment } as Payment;
    client.payments = client.payments || [];
    client.payments.push(newPayment);
    client.deuda = Math.max(0, client.deuda - newPayment.amount);
    return delay(newPayment);
  }
}

export async function createClient(payload: Omit<Cliente, 'id' | 'payments'>): Promise<Cliente> {
  try {
    const res = await tryFetch<Cliente>(`${API_BASE}/clients`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    return res;
  } catch (err) {
    const id = `C-${String(Date.now()).slice(-6)}`;
    const newClient: Cliente = { id, payments: [], credits: [], ...payload } as Cliente;
    clients.push(newClient);
    return delay({ ...newClient });
  }
}

export async function createCredit(clientId: string, credit: Omit<Credit, 'id' | 'date' | 'total'> & { amount: number; interest?: number; frequency: Credit['frequency'] }): Promise<Credit | undefined> {
  try {
    const res = await tryFetch<Credit>(`${API_BASE}/clients/${clientId}/credits`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount: credit.amount, interest: credit.interest, frequency: credit.frequency }) });
    return res;
  } catch (err) {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return delay(undefined);
    const interest = typeof credit.interest === 'number' ? credit.interest : 20;
    const total = Math.round((credit.amount + (credit.amount * interest) / 100) * 100) / 100;
    const newCredit: Credit = { id: `CR-${Date.now()}`, amount: credit.amount, interest, total, frequency: credit.frequency, date: new Date().toISOString().slice(0,10) };
    client.credits = client.credits || [];
    client.credits.push(newCredit);
    client.deuda = (client.deuda || 0) + newCredit.total;
    return delay(newCredit);
  }
}
