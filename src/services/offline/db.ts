import Dexie, { Table } from 'dexie';

export interface OutboxEntry {
  id?: number;
  method: string;
  url: string;
  body: string;
  headers?: Record<string, string>;
  createdAt: number;
  retryCount: number;
  lastError?: string;
  clientId: string; // for idempotency
}

export interface CacheEntry {
  key: string; // GET url
  data: any;
  timestamp: number;
}

export class AlinceDB extends Dexie {
  outbox!: Table<OutboxEntry, number>;
  cache!: Table<CacheEntry, string>;

  constructor() {
    super('AlinceDB');
    this.version(1).stores({
      outbox: '++id, createdAt',
      cache: 'key, timestamp'
    });
  }
}

export const db = new AlinceDB();
