import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/services/api';
import { useAdminAuth } from '@/context/AdminContext';
import type { CreateMenuItemRequest, UpdateMenuItemRequest, DateRange } from '@/types/api';

// Query keys for admin operations
export const adminKeys = {
  all: ['admin'] as const,
  stats: (dateRange?: DateRange) => [...adminKeys.all, 'stats', dateRange] as const,
  ordersByHour: (dateRange?: DateRange) => [...adminKeys.all, 'orders-by-hour', dateRange] as const,
  popularItems: (dateRange?: DateRange) => [...adminKeys.all, 'popular-items', dateRange] as const,
  dailyBreakdown: (dateRange?: DateRange) => [...adminKeys.all, 'daily-breakdown', dateRange] as const,
  menu: () => [...adminKeys.all, 'menu'] as const,
  menuItem: (id: number) => [...adminKeys.all, 'menu', id] as const,
  orders: () => [...adminKeys.all, 'orders'] as const,
};

export function useAdminStats(dateRange?: DateRange) {
  const { getPassword, isAuthenticated } = useAdminAuth();

  return useQuery({
    queryKey: adminKeys.stats(dateRange),
    queryFn: () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.getStats(password, dateRange);
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
    retry: 2,
  });
}

export function useOrdersByHour(dateRange?: DateRange) {
  const { getPassword, isAuthenticated } = useAdminAuth();

  return useQuery({
    queryKey: adminKeys.ordersByHour(dateRange),
    queryFn: () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.getOrdersByHour(password, dateRange);
    },
    enabled: isAuthenticated,
    refetchInterval: 60000,
    retry: 2,
  });
}

export function usePopularItems(dateRange?: DateRange) {
  const { getPassword, isAuthenticated } = useAdminAuth();

  return useQuery({
    queryKey: adminKeys.popularItems(dateRange),
    queryFn: () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.getPopularItems(password, dateRange);
    },
    enabled: isAuthenticated,
    refetchInterval: 60000,
    retry: 2,
  });
}

export function useDailyBreakdown(dateRange?: DateRange) {
  const { getPassword, isAuthenticated } = useAdminAuth();

  return useQuery({
    queryKey: adminKeys.dailyBreakdown(dateRange),
    queryFn: () => {
      const password = getPassword();
      if (!password) throw new Error('Not authenticated');
      return adminApi.getDailyBreakdown(password, dateRange);
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
