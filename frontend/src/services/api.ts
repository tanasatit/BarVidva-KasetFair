import axios, { AxiosError } from 'axios';
import type {
  MenuItem,
  Order,
  CreateOrderRequest,
  ApiError,
  DashboardStats,
  OrdersByHour,
  PopularItem,
  DailyBreakdown,
  DateRange,
  CreateMenuItemRequest,
  UpdateMenuItemRequest,
  PaymentMethod,
} from '@/types/api';

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const message = error.response?.data?.error || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Menu API
export const menuApi = {
  getAll: async (): Promise<MenuItem[]> => {
    const { data } = await api.get<MenuItem[]>('/menu');
    return data;
  },

  getAvailable: async (): Promise<MenuItem[]> => {
    const { data } = await api.get<MenuItem[]>('/menu', {
      params: { available: true },
    });
    return data;
  },

  getCategories: async (): Promise<string[]> => {
    const { data } = await api.get<string[]>('/categories');
    return data;
  },
};

// Order API
export const orderApi = {
  create: async (order: CreateOrderRequest): Promise<Order> => {
    const { data } = await api.post<Order>('/orders', order);
    return data;
  },

  getById: async (id: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${id}`);
    return data;
  },

  getQueue: async (category?: string): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/queue', {
      params: category ? { category } : undefined,
    });
    return data;
  },
};

// POS API (public routes for staff-only POS system)
export const posApi = {
  getPendingOrders: async (category?: string): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/pos/orders/pending', {
      params: category ? { category } : undefined,
    });
    return data;
  },

  getCompletedOrders: async (category?: string): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/pos/orders/completed', {
      params: category ? { category } : undefined,
    });
    return data;
  },

  markPaid: async (orderId: string, paymentMethod?: PaymentMethod): Promise<Order> => {
    const { data } = await api.put<Order>(`/pos/orders/${orderId}/mark-paid`, {
      payment_method: paymentMethod,
    });
    return data;
  },

  completeOrder: async (orderId: string): Promise<Order> => {
    const { data } = await api.put<Order>(`/pos/orders/${orderId}/complete`);
    return data;
  },
};

// Create authenticated axios instance
const createAuthApi = (password: string) => {
  const instance = axios.create({
    baseURL: '/api/v1',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${password}`,
    },
  });

  instance.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.error || 'An error occurred';
      return Promise.reject(new Error(message));
    }
  );

  return instance;
};

// Staff API (requires authentication)
export const staffApi = {
  getPendingOrders: async (password: string): Promise<Order[]> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.get<Order[]>('/staff/orders/pending');
    return data;
  },

  getCompletedOrders: async (password: string): Promise<Order[]> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.get<Order[]>('/staff/orders/completed');
    return data;
  },

  verifyPayment: async (password: string, orderId: string): Promise<Order> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.put<Order>(`/staff/orders/${orderId}/verify`);
    return data;
  },

  completeOrder: async (password: string, orderId: string): Promise<Order> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.put<Order>(`/staff/orders/${orderId}/complete`);
    return data;
  },

  cancelOrder: async (password: string, orderId: string): Promise<void> => {
    const authApi = createAuthApi(password);
    await authApi.delete(`/staff/orders/${orderId}`);
  },

  testAuth: async (password: string): Promise<boolean> => {
    try {
      const authApi = createAuthApi(password);
      await authApi.get('/staff/orders/pending');
      return true;
    } catch {
      return false;
    }
  },
};

// Admin API (requires admin authentication)
export const adminApi = {
  // Auth test
  testAuth: async (password: string): Promise<boolean> => {
    try {
      const authApi = createAuthApi(password);
      await authApi.get('/admin/menu');
      return true;
    } catch {
      return false;
    }
  },

  // Dashboard stats
  getStats: async (password: string, dateRange?: DateRange): Promise<DashboardStats> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.get<DashboardStats>('/admin/stats', {
      params: dateRange,
    });
    return data;
  },

  getOrdersByHour: async (password: string, dateRange?: DateRange): Promise<OrdersByHour[]> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.get<OrdersByHour[]>('/admin/stats/orders-by-hour', {
      params: dateRange,
    });
    return data;
  },

  getPopularItems: async (password: string, dateRange?: DateRange): Promise<PopularItem[]> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.get<PopularItem[]>('/admin/stats/popular-items', {
      params: dateRange,
    });
    return data;
  },

  getDailyBreakdown: async (password: string, dateRange?: DateRange): Promise<DailyBreakdown[]> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.get<DailyBreakdown[]>('/admin/stats/daily-breakdown', {
      params: dateRange,
    });
    return data;
  },

  // Menu management
  getMenu: async (password: string): Promise<MenuItem[]> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.get<MenuItem[]>('/admin/menu');
    return data;
  },

  getMenuItem: async (password: string, id: number): Promise<MenuItem> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.get<MenuItem>(`/admin/menu/${id}`);
    return data;
  },

  createMenuItem: async (password: string, item: CreateMenuItemRequest): Promise<MenuItem> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.post<MenuItem>('/admin/menu', item);
    return data;
  },

  updateMenuItem: async (
    password: string,
    id: number,
    item: UpdateMenuItemRequest
  ): Promise<MenuItem> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.put<MenuItem>(`/admin/menu/${id}`, item);
    return data;
  },

  deleteMenuItem: async (password: string, id: number): Promise<void> => {
    const authApi = createAuthApi(password);
    await authApi.delete(`/admin/menu/${id}`);
  },

  // Orders (admin can see all orders)
  getAllOrders: async (password: string): Promise<Order[]> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.get<Order[]>('/admin/orders');
    return data;
  },

  // Delete orders
  deleteOrders: async (password: string, orderIds: string[]): Promise<{ deleted_count: number }> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.delete<{ deleted_count: number }>('/admin/orders', {
      data: { order_ids: orderIds },
    });
    return data;
  },

  deleteAllOrders: async (password: string): Promise<{ deleted_count: number }> => {
    const authApi = createAuthApi(password);
    const { data } = await authApi.delete<{ deleted_count: number }>('/admin/orders?all=true');
    return data;
  },
};

export default api;
