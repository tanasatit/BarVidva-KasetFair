// Types matching Go backend models

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'READY'
  | 'COMPLETED'
  | 'CANCELLED';

export interface MenuItem {
  id: number;
  name: string;
  price: number;
  category?: string;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  menu_item_id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customer_name: string;
  items: OrderItem[];
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  paid_at?: string;
  completed_at?: string;
  queue_number?: number;
  day: number;
}

export interface CreateOrderRequest {
  id: string;
  customer_name: string;
  items: OrderItem[];
  day: number;
}

export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, unknown>;
}

// Cart state for customer ordering
export interface CartItem extends OrderItem {
  menu_item_id: number;
}

// Admin stats types
export interface DashboardStats {
  total_orders_today: number;
  total_revenue_today: number;
  pending_orders: number;
  queue_length: number;
  completed_orders: number;
  cancelled_orders: number;
  avg_completion_time_mins: number;
}

export interface OrdersByHour {
  hour: number;
  count: number;
  revenue: number;
}

export interface PopularItem {
  menu_item_id: number;
  name: string;
  quantity_sold: number;
  revenue: number;
}

export interface CreateMenuItemRequest {
  name: string;
  price: number;
  category?: string;
  available: boolean;
}

export interface UpdateMenuItemRequest {
  name?: string;
  price?: number;
  category?: string;
  available?: boolean;
}
