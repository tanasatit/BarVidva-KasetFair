import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { orderApi } from '@/services/api';
import type { CreateOrderRequest } from '@/types/api';

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (order: CreateOrderRequest) => orderApi.create(order),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => orderApi.getById(id!),
    enabled: !!id,
    refetchInterval: 5000, // Poll every 5 seconds for status updates
    retry: 3,
  });
}

export function useQueue() {
  return useQuery({
    queryKey: ['queue'],
    queryFn: orderApi.getQueue,
    refetchInterval: 10000, // Poll every 10 seconds
    retry: 3,
  });
}
