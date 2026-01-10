import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { useAdminAuth } from '@/context/AdminContext';
import type { CreateMenuItemRequest, UpdateMenuItemRequest } from '@/types/api';

// Query keys for admin operations
export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  ordersByHour: () => [...adminKeys.all, 'orders-by-hour'] as const,
  popularItems: () => [...adminKeys.all, 'popular-items'] as const,
  menu: () => [...adminKeys.all, 'menu'] as const,
  menuItem: (id: number) => [...adminKeys.all, 'menu', id] as const,
  orders: () => [...adminKeys.all, 'orders'] as const,
};

export function useAdminStats() {
  const { getPassword, isAuthenticated } = useAdminAuth();

  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.getStats(password);
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2,
  });
}

export function useOrdersByHour() {
  const { getPassword, isAuthenticated } = useAdminAuth();

  return useQuery({
    queryKey: adminKeys.ordersByHour(),
    queryFn: () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.getOrdersByHour(password);
    },
    enabled: isAuthenticated,
    refetchInterval: 60000, // Refresh every minute
    retry: 2,
  });
}

export function usePopularItems() {
  const { getPassword, isAuthenticated } = useAdminAuth();

  return useQuery({
    queryKey: adminKeys.popularItems(),
    queryFn: () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.getPopularItems(password);
    },
    enabled: isAuthenticated,
    refetchInterval: 60000,
    retry: 2,
  });
}

export function useAdminMenu() {
  const { getPassword, isAuthenticated } = useAdminAuth();

  return useQuery({
    queryKey: adminKeys.menu(),
    queryFn: () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.getMenu(password);
    },
    enabled: isAuthenticated,
    retry: 2,
  });
}

export function useCreateMenuItem() {
  const queryClient = useQueryClient();
  const { getPassword } = useAdminAuth();

  return useMutation({
    mutationFn: (item: CreateMenuItemRequest) => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.createMenuItem(password, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.menu() });
      // Also invalidate public menu
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useUpdateMenuItem() {
  const queryClient = useQueryClient();
  const { getPassword } = useAdminAuth();

  return useMutation({
    mutationFn: ({ id, item }: { id: number; item: UpdateMenuItemRequest }) => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.updateMenuItem(password, id, item);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.menu() });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useDeleteMenuItem() {
  const queryClient = useQueryClient();
  const { getPassword } = useAdminAuth();

  return useMutation({
    mutationFn: (id: number) => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.deleteMenuItem(password, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.menu() });
      queryClient.invalidateQueries({ queryKey: ['menu'] });
    },
  });
}

export function useAllOrders() {
  const { getPassword, isAuthenticated } = useAdminAuth();

  return useQuery({
    queryKey: adminKeys.orders(),
    queryFn: () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.getAllOrders(password);
    },
    enabled: isAuthenticated,
    refetchInterval: 10000,
    retry: 2,
  });
}
