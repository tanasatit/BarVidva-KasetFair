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
  image_url?: string;
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

export type PaymentMethod = 'PROMPTPAY' | 'CASH';

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
  date_key: number;
  payment_method?: PaymentMethod | null;
  category?: string;
}

export interface CreateOrderRequest {
  id?: string; // Optional - server generates sequential ID
  customer_name: string;
  items: OrderItem[];
  date_key: number;
  category?: string;
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

// Date range for stats queries
export interface DateRange {
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
}

// Admin stats types
export interface DashboardStats {
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  queue_length: number;
  completed_orders: number;
  cancelled_orders: number;
  avg_completion_time_mins: number;
  promptpay_revenue: number;
  cash_revenue: number;
  promptpay_count: number;
  cash_count: number;
  start_date: string;
  end_date: string;
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

export interface DailyBreakdown {
  date: string;
  total_orders: number;
  revenue: number;
  completed: number;
  cancelled: number;
  avg_completion_mins: number;
}

export interface CreateMenuItemRequest {
  name: string;
  price: number;
  category?: string;
  image_url?: string;
  available: boolean;
}

export interface UpdateMenuItemRequest {
  name?: string;
  price?: number;
  category?: string;
  image_url?: string;
  available?: boolean;
}
