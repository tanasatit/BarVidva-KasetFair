import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { staffApi } from '@/services/api';
import { useStaffAuth } from '@/context/StaffContext';

// Query keys for staff operations
export const staffKeys = {
  all: ['staff'] as const,
  pending: () => [...staffKeys.all, 'pending'] as const,
  queue: () => [...staffKeys.all, 'queue'] as const,
  completed: () => [...staffKeys.all, 'completed'] as const,
};

export function usePendingOrders() {
  const { getPassword, isAuthenticated } = useStaffAuth();

  return useQuery({
    queryKey: staffKeys.pending(),
    queryFn: () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return staffApi.getPendingOrders(password);
    },
    enabled: isAuthenticated,
    refetchInterval: 5000, // Poll every 5 seconds for new orders
    retry: 3,
  });
}

export function useQueueOrders() {
  const { getPassword, isAuthenticated } = useStaffAuth();

  return useQuery({
    queryKey: staffKeys.queue(),
    queryFn: async () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      // Queue orders are PAID status, fetched from the public queue endpoint
      // but we use staff API for consistency
      const { orderApi } = await import('@/services/api');
      return orderApi.getQueue();
    },
    enabled: isAuthenticated,
    refetchInterval: 5000,
    retry: 3,
  });
}

export function useCompletedOrders() {
  const { getPassword, isAuthenticated } = useStaffAuth();

  return useQuery({
    queryKey: staffKeys.completed(),
    queryFn: () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return staffApi.getCompletedOrders(password);
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Less frequent for completed orders
    retry: 3,
  });
}

export function useVerifyPayment() {
  const queryClient = useQueryClient();
  const { getPassword } = useStaffAuth();

  return useMutation({
    mutationFn: (orderId: string) => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return staffApi.verifyPayment(password, orderId);
    },
    onSuccess: () => {
      // Invalidate all staff queries to refresh data
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    retry: 2,
  });
}

export function useCompleteOrder() {
  const queryClient = useQueryClient();
  const { getPassword } = useStaffAuth();

  return useMutation({
    mutationFn: (orderId: string) => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return staffApi.completeOrder(password, orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
      queryClient.invalidateQueries({ queryKey: ['queue'] });
    },
    retry: 2,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  const { getPassword } = useStaffAuth();

  return useMutation({
    mutationFn: (orderId: string) => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return staffApi.cancelOrder(password, orderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.all });
    },
    retry: 2,
  });
}
