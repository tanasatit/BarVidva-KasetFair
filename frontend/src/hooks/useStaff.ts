import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '@/services/api';

// Get staff password from localStorage or env (staff-only POS system)
const getStaffPassword = (): string =>
  localStorage.getItem('staff_password') ||
  import.meta.env.VITE_STAFF_PASSWORD ||
  'staff123';

// Query keys for staff operations
export const staffKeys = {
  all: ['staff'] as const,
  pending: () => [...staffKeys.all, 'pending'] as const,
  queue: () => [...staffKeys.all, 'queue'] as const,
  completed: () => [...staffKeys.all, 'completed'] as const,
};

export function usePendingOrders() {
  return useQuery({
    queryKey: staffKeys.pending(),
    queryFn: () => staffApi.getPendingOrders(getStaffPassword()),
    refetchInterval: 5000, // Poll every 5 seconds for new orders
    retry: 3,
  });
}

export function useQueueOrders() {
  return useQuery({
    queryKey: staffKeys.queue(),
    queryFn: async () => {
      const { orderApi } = await import('@/services/api');
      return orderApi.getQueue();
    },
    refetchInterval: 5000,
    retry: 3,
  });
}

export function useCompletedOrders() {
  return useQuery({
    queryKey: staffKeys.completed(),
    queryFn: () => staffApi.getCompletedOrders(getStaffPassword()),
    refetchInterval: 30000, // Less frequent for completed orders
    retry: 3,
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      staffApi.verifyPayment(getStaffPassword(), orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    retry: 2,
  });
}

export function useCompleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      staffApi.completeOrder(getStaffPassword(), orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    retry: 2,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) =>
      staffApi.cancelOrder(getStaffPassword(), orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
    retry: 2,
  });
}
