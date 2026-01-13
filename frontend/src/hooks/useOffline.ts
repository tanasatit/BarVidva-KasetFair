import { useState, useEffect, useCallback } from 'react';
import { orderApi } from '@/services/api';
import {
  savePendingOrder,
  getPendingOrders,
  markOrderSynced,
  updatePendingOrder,
  getPendingOrderCount,
  hasPendingOrders,
  type PendingOrder,
} from '@/services/offline';
import type { CreateOrderRequest, Order } from '@/types/api';

// Hook to track online/offline status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook to manage pending orders count
export function usePendingOrdersCount() {
  const [count, setCount] = useState(0);

  const refreshCount = useCallback(async () => {
    const pendingCount = await getPendingOrderCount();
    setCount(pendingCount);
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return { count, refreshCount };
}

// Main hook for offline-capable order submission
export function useOfflineOrder() {
  const isOnline = useOnlineStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Submit an order - works online or offline
  const submitOrder = useCallback(
    async (orderData: CreateOrderRequest): Promise<{ order?: Order; pending?: PendingOrder; isOffline: boolean }> => {
      if (isOnline) {
        // Try to submit online first
        try {
          const order = await orderApi.create(orderData);
          return { order, isOffline: false };
        } catch (error) {
          // Network failed despite being "online" - save offline
          console.warn('Network request failed, saving offline:', error);
          const pending = await savePendingOrder(orderData);
          return { pending, isOffline: true };
        }
      } else {
        // Offline - save to IndexedDB
        const pending = await savePendingOrder(orderData);
        return { pending, isOffline: true };
      }
    },
    [isOnline]
  );

  // Sync all pending orders
  const syncPendingOrders = useCallback(async (): Promise<{
    synced: Order[];
    failed: PendingOrder[];
  }> => {
    if (!isOnline) {
      return { synced: [], failed: [] };
    }

    setIsSyncing(true);
    setSyncError(null);

    const synced: Order[] = [];
    const failed: PendingOrder[] = [];

    try {
      const pendingOrders = await getPendingOrders();

      for (const pending of pendingOrders) {
        try {
          const order = await orderApi.create(pending.orderData);
          await markOrderSynced(order);
          synced.push(order);
        } catch (error) {
          // Update retry count
          pending.retryCount += 1;
          pending.lastError = error instanceof Error ? error.message : 'Unknown error';
          await updatePendingOrder(pending);
          failed.push(pending);
        }
      }

      if (failed.length > 0) {
        setSyncError(`${failed.length} order(s) failed to sync`);
      }
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }

    return { synced, failed };
  }, [isOnline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      // Check if we have pending orders and sync them
      hasPendingOrders().then((hasPending) => {
        if (hasPending) {
          syncPendingOrders();
        }
      });
    }
  }, [isOnline, syncPendingOrders]);

  return {
    isOnline,
    isSyncing,
    syncError,
    submitOrder,
    syncPendingOrders,
  };
}
