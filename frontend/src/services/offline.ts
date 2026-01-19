import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { CreateOrderRequest, Order } from '@/types/api';

// Define the database schema
interface BarVidvaDB extends DBSchema {
  pendingOrders: {
    key: string; // order ID
    value: PendingOrder;
    indexes: { 'by-created': number };
  };
  syncedOrders: {
    key: string; // order ID
    value: SyncedOrder;
    indexes: { 'by-synced': number };
  };
}

// A pending order waiting to be synced
export interface PendingOrder {
  id: string;
  orderData: CreateOrderRequest;
  createdAt: number; // timestamp
  retryCount: number;
  lastError?: string;
}

// A successfully synced order (for showing confirmation)
export interface SyncedOrder {
  id: string;
  order: Order;
  syncedAt: number;
}

const DB_NAME = 'barvidva-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<BarVidvaDB>> | null = null;

// Initialize the database
function getDB(): Promise<IDBPDatabase<BarVidvaDB>> {
  if (!dbPromise) {
    dbPromise = openDB<BarVidvaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create pending orders store
        if (!db.objectStoreNames.contains('pendingOrders')) {
          const pendingStore = db.createObjectStore('pendingOrders', { keyPath: 'id' });
          pendingStore.createIndex('by-created', 'createdAt');
        }

        // Create synced orders store (for confirmation display)
        if (!db.objectStoreNames.contains('syncedOrders')) {
          const syncedStore = db.createObjectStore('syncedOrders', { keyPath: 'id' });
          syncedStore.createIndex('by-synced', 'syncedAt');
        }
      },
    });
  }
  return dbPromise;
}

// Generate a temporary local ID for offline orders
function generateTempId(): string {
  return `TEMP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

// Save a pending order to IndexedDB
export async function savePendingOrder(orderData: CreateOrderRequest): Promise<PendingOrder> {
  const db = await getDB();
  // Use temporary ID for local storage (server will assign real sequential ID)
  const tempId = generateTempId();
  const pendingOrder: PendingOrder = {
    id: tempId,
    orderData,
    createdAt: Date.now(),
    retryCount: 0,
  };
  await db.put('pendingOrders', pendingOrder);
  return pendingOrder;
}

// Get all pending orders
export async function getPendingOrders(): Promise<PendingOrder[]> {
  const db = await getDB();
  return db.getAllFromIndex('pendingOrders', 'by-created');
}

// Get a specific pending order
export async function getPendingOrder(id: string): Promise<PendingOrder | undefined> {
  const db = await getDB();
  return db.get('pendingOrders', id);
}

// Update a pending order (e.g., increment retry count)
export async function updatePendingOrder(order: PendingOrder): Promise<void> {
  const db = await getDB();
  await db.put('pendingOrders', order);
}

// Remove a pending order (after successful sync)
export async function removePendingOrder(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pendingOrders', id);
}

// Mark an order as synced
// tempId: the temporary ID used in IndexedDB (TEMP-xxxxx format)
// order: the server-returned order with real ID
export async function markOrderSynced(tempId: string, order: Order): Promise<void> {
  const db = await getDB();

  // Remove from pending using the temp ID (the key in IndexedDB)
  await db.delete('pendingOrders', tempId);

  // Add to synced using the real server ID
  const syncedOrder: SyncedOrder = {
    id: order.id,
    order,
    syncedAt: Date.now(),
  };
  await db.put('syncedOrders', syncedOrder);
}

// Get synced order (for showing confirmation after coming back online)
export async function getSyncedOrder(id: string): Promise<SyncedOrder | undefined> {
  const db = await getDB();
  return db.get('syncedOrders', id);
}

// Clean up old synced orders (older than 1 hour)
export async function cleanupOldSyncedOrders(): Promise<void> {
  const db = await getDB();
  const oneHourAgo = Date.now() - 60 * 60 * 1000;

  const tx = db.transaction('syncedOrders', 'readwrite');
  const index = tx.store.index('by-synced');

  let cursor = await index.openCursor();
  while (cursor) {
    if (cursor.value.syncedAt < oneHourAgo) {
      await cursor.delete();
    }
    cursor = await cursor.continue();
  }
}

// Check if we have any pending orders
export async function hasPendingOrders(): Promise<boolean> {
  const db = await getDB();
  const count = await db.count('pendingOrders');
  return count > 0;
}

// Get count of pending orders
export async function getPendingOrderCount(): Promise<number> {
  const db = await getDB();
  return db.count('pendingOrders');
}
