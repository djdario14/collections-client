import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

const DB_NAME = 'cobranzas.db';

class SQLiteService {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isWeb = Capacitor.getPlatform() === 'web';

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async init() {
    if (this.isWeb) {
      console.log('SQLite no disponible en web, usando modo online');
      this.db = null;
      return false;
    }

    try {
      // Crear o abrir la base de datos
      this.db = await this.sqlite.createConnection(
        DB_NAME,
        false,
        'no-encryption',
        1,
        false
      );
      
      await this.db.open();
      await this.createTables();
      console.log('SQLite inicializado correctamente');
      return true;
    } catch (error) {
      console.error('Error al inicializar SQLite:', error);
      return false;
    }
  }

  private async createTables() {
    if (!this.db) return;

    const schema = `
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        identificacion TEXT,
        ubicacionGps TEXT,
        direccion TEXT,
        negocio TEXT,
        telefono TEXT,
        deuda REAL DEFAULT 0,
        vencimiento TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        syncStatus TEXT DEFAULT 'synced'
      );

      CREATE TABLE IF NOT EXISTS credits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        amount REAL NOT NULL,
        interest REAL NOT NULL,
        total REAL NOT NULL,
        frequency TEXT NOT NULL,
        cuotas INTEGER DEFAULT 1,
        valorCuota REAL DEFAULT 0,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        syncStatus TEXT DEFAULT 'synced',
        FOREIGN KEY (clientId) REFERENCES clients(id)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        clientId INTEGER NOT NULL,
        creditId INTEGER,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        notes TEXT,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        syncStatus TEXT DEFAULT 'synced',
        FOREIGN KEY (clientId) REFERENCES clients(id),
        FOREIGN KEY (creditId) REFERENCES credits(id)
      );

      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        record_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        data TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await this.db.execute(schema);
  }

  // ==================== CLIENTS ====================
  
  async getClients() {
    if (this.isWeb || !this.db) return [];

    const result = await this.db.query(`
      SELECT 
        c.*,
        (SELECT json_group_array(json_object('id', 'P-' || id, 'amount', amount, 'date', date, 'notes', notes, 'creditId', 'CR-' || creditId))
         FROM payments WHERE clientId = c.id) as payments,
        (SELECT json_group_array(json_object('id', 'CR-' || id, 'amount', amount, 'interest', interest, 'total', total, 'frequency', frequency, 'cuotas', cuotas, 'valorCuota', valorCuota, 'date', createdAt))
         FROM credits WHERE clientId = c.id) as credits
      FROM clients c
    `);

    return result.values?.map((c: any) => ({
      ...c,
      id: 'C-' + String(c.id),
      payments: c.payments && c.payments !== '[]' ? JSON.parse(c.payments) : [],
      credits: c.credits && c.credits !== '[]' ? JSON.parse(c.credits) : []
    })) || [];
  }

  async getClientById(id: string) {
    if (this.isWeb || !this.db) return null;

    const numericId = id.startsWith('C-') ? id.slice(2) : id;

    const result = await this.db.query(`
      SELECT 
        c.*,
        (SELECT json_group_array(json_object('id', 'P-' || id, 'amount', amount, 'date', date, 'notes', notes, 'creditId', 'CR-' || creditId))
         FROM payments WHERE clientId = c.id) as payments,
        (SELECT json_group_array(json_object('id', 'CR-' || id, 'amount', amount, 'interest', interest, 'total', total, 'frequency', frequency, 'cuotas', cuotas, 'valorCuota', valorCuota, 'date', createdAt))
         FROM credits WHERE clientId = c.id) as credits
      FROM clients c
      WHERE c.id = ?
    `, [numericId]);

    if (!result.values || result.values.length === 0) return null;

    const client = result.values[0];
    return {
      ...client,
      id: 'C-' + String(client.id),
      payments: client.payments && client.payments !== '[]' ? JSON.parse(client.payments) : [],
      credits: client.credits && client.credits !== '[]' ? JSON.parse(client.credits) : []
    };
  }

  async createClient(client: any) {
    if (this.isWeb || !this.db) return null;

    const result = await this.db.run(
      `INSERT INTO clients (nombre, identificacion, ubicacionGps, direccion, negocio, telefono, deuda, vencimiento, syncStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        client.nombre,
        client.identificacion || '',
        client.ubicacionGps || '',
        client.direccion || '',
        client.negocio || '',
        client.telefono || '',
        client.deuda || 0,
        client.vencimiento || ''
      ]
    );

    const newId = result.changes?.lastId;
    if (!newId) return null;

    // Agregar a cola de sincronización
    await this.addToSyncQueue('clients', newId, 'create', client);

    return {
      id: 'C-' + String(newId),
      ...client,
      payments: [],
      credits: []
    };
  }

  async updateClient(clientId: string, data: any) {
    if (this.isWeb || !this.db) return null;

    const numericId = clientId.startsWith('C-') ? clientId.slice(2) : clientId;
    
    const fields: string[] = [];
    const values: any[] = [];
    
    if (data.nombre !== undefined) {
      fields.push('nombre = ?');
      values.push(data.nombre);
    }
    if (data.identificacion !== undefined) {
      fields.push('identificacion = ?');
      values.push(data.identificacion);
    }
    if (data.telefono !== undefined) {
      fields.push('telefono = ?');
      values.push(data.telefono);
    }
    if (data.negocio !== undefined) {
      fields.push('negocio = ?');
      values.push(data.negocio);
    }
    if (data.ubicacionGps !== undefined) {
      fields.push('ubicacionGps = ?');
      values.push(data.ubicacionGps);
    }
    
    if (fields.length === 0) return null;
    
    fields.push('syncStatus = ?');
    values.push('pending');
    values.push(numericId);
    
    await this.db.run(
      `UPDATE clients SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    // Agregar a cola de sincronización
    await this.addToSyncQueue('clients', parseInt(numericId), 'update', data);

    return await this.getClientById(clientId);
  }

  // ==================== CREDITS ====================
  
  async createCredit(clientId: string, credit: any) {
    if (this.isWeb || !this.db) return null;

    const numericId = clientId.startsWith('C-') ? parseInt(clientId.slice(2)) : parseInt(clientId);
    const total = Math.round((credit.amount + (credit.amount * credit.interest) / 100) * 100) / 100;
    const valorCuota = Math.round((total / credit.cuotas) * 100) / 100;

    const result = await this.db.run(
      `INSERT INTO credits (clientId, amount, interest, total, frequency, cuotas, valorCuota, syncStatus)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [numericId, credit.amount, credit.interest, total, credit.frequency, credit.cuotas, valorCuota]
    );

    // Actualizar deuda del cliente
    await this.db.run(
      `UPDATE clients SET deuda = deuda + ?, syncStatus = 'pending' WHERE id = ?`,
      [total, numericId]
    );

    const newId = result.changes?.lastId;
    if (!newId) return null;

    await this.addToSyncQueue('credits', newId, 'create', credit);

    return {
      id: 'CR-' + String(newId),
      amount: credit.amount,
      interest: credit.interest,
      total,
      frequency: credit.frequency,
      cuotas: credit.cuotas,
      valorCuota,
      date: new Date().toISOString()
    };
  }

  // ==================== PAYMENTS ====================
  
  async createPayment(clientId: string, payment: any) {
    if (this.isWeb || !this.db) return null;

    const numericId = clientId.startsWith('C-') ? parseInt(clientId.slice(2)) : parseInt(clientId);
    const numericCreditId = payment.creditId && payment.creditId.startsWith('CR-') ? parseInt(payment.creditId.slice(3)) : null;

    const result = await this.db.run(
      `INSERT INTO payments (clientId, creditId, amount, date, notes, syncStatus)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [numericId, numericCreditId, payment.amount, payment.date || new Date().toISOString(), payment.notes || null]
    );

    // Actualizar deuda del cliente solo si amount > 0
    if (payment.amount > 0) {
      await this.db.run(
        `UPDATE clients SET deuda = MAX(0, deuda - ?), syncStatus = 'pending' WHERE id = ?`,
        [payment.amount, numericId]
      );
    }

    const newId = result.changes?.lastId;
    if (!newId) return null;

    await this.addToSyncQueue('payments', newId, 'create', payment);

    return {
      id: 'P-' + String(newId),
      amount: payment.amount,
      date: payment.date || new Date().toISOString(),
      notes: payment.notes
    };
  }

  // ==================== SYNC QUEUE ====================
  
  private async addToSyncQueue(tableName: string, recordId: number, action: string, data: any) {
    if (this.isWeb || !this.db) return;

    await this.db.run(
      `INSERT INTO sync_queue (table_name, record_id, action, data)
       VALUES (?, ?, ?, ?)`,
      [tableName, recordId, action, JSON.stringify(data)]
    );
  }

  async getSyncQueue() {
    if (this.isWeb || !this.db) return [];

    const result = await this.db.query(
      `SELECT * FROM sync_queue ORDER BY created_at ASC`
    );

    return result.values?.map((item: any) => ({
      ...item,
      data: JSON.parse(item.data)
    })) || [];
  }

  async clearSyncQueue() {
    if (this.isWeb || !this.db) return;

    await this.db.run(`DELETE FROM sync_queue`);
  }

  async removeSyncQueueItem(id: number) {
    if (this.isWeb || !this.db) return;

    await this.db.run(`DELETE FROM sync_queue WHERE id = ?`, [id]);
  }

  // ==================== UTILS ====================
  
  async close() {
    if (this.isWeb) return;
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  isAvailable() {
    return !this.isWeb && this.db !== null;
  }
}

export default new SQLiteService();
