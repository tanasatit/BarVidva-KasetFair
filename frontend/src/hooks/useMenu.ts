import { useQuery } from '@tanstack/react-query';
import { menuApi } from '@/services/api';
import type { MenuItem } from '@/types/api';

// Ensure data is always an array
const ensureArray = <T>(data: T | T[] | null | undefined): T[] => {
  if (Array.isArray(data)) return data;
  return [];
};

export function useMenu() {
  return useQuery({
    queryKey: ['menu'],
    queryFn: menuApi.getAvailable,
    select: (data): MenuItem[] => ensureArray(data),
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useAllMenu() {
  return useQuery({
    queryKey: ['menu', 'all'],
    queryFn: menuApi.getAll,
    select: (data): MenuItem[] => ensureArray(data),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    retry: 3,
  });
}
