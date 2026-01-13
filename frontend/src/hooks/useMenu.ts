import { useQuery } from '@tanstack/react-query';
import { menuApi } from '@/services/api';

export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: menuApi.getAvailable,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useAllMenu() {
  return useQuery({
    queryKey: ['menu', 'all'],
    queryFn: menuApi.getAll,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 3,
  });
}
