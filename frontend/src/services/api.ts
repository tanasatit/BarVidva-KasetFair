import axios, { AxiosError } from 'axios';
import type { MenuItem, Order, CreateOrderRequest, ApiError } from '@/types/api';

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

  getQueue: async (): Promise<Order[]> => {
    const { data } = await api.get<Order[]>('/queue');
    return data;
  },
};

export default api;
