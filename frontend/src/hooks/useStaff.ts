import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi, posApi } from '@/services/api';
import type { Order } from '@/types/api';

// Ensure data is always an array
const ensureArray = <T>(data: T | T[] | null | undefined): T[] => {
  if (Array.isArray(data)) return data;
  return [];
};

// Query keys for POS operations
export const posKeys = {
  all: ['pos'] as const,
  pending: () => [...posKeys.all, 'pending'] as const,
  queue: () => [...posKeys.all, 'queue'] as const,
  completed: () => [...posKeys.all, 'completed'] as const,
};

export function usePendingOrders() {
  return useQuery({
    queryKey: posKeys.pending(),
    queryFn: () => posApi.getPendingOrders(),
    select: (data): Order[] => ensureArray(data),
    refetchInterval: 5000, // Poll every 5 seconds for new orders
    retry: 3,
  });
}

export function useQueueOrders() {
  return useQuery({
    queryKey: posKeys.queue(),
    queryFn: () => orderApi.getQueue(),
    select: (data): Order[] => ensureArray(data),
    refetchInterval: 5000,
    retry: 3,
  });
}

export function useCompletedOrders() {
  return useQuery({
    queryKey: posKeys.completed(),
    queryFn: () => posApi.getCompletedOrders(),
    select: (data): Order[] => ensureArray(data),
    refetchInterval: 30000, // Less frequent for completed orders
    retry: 3,
  });
}

export function useMarkPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => posApi.markPaid(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    retry: 2,
  });
}

export function useCompleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => posApi.completeOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: posKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    retry: 2,
  });
}
