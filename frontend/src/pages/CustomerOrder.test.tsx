import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { CustomerOrder } from './CustomerOrder';
import * as useMenuModule from '@/hooks/useMenu';
import * as useOfflineModule from '@/hooks/useOffline';
import type { MenuItem } from '@/types/api';

// Mock the hooks
vi.mock('@/hooks/useMenu', () => ({
  useAllMenu: vi.fn(),
}));

vi.mock('@/hooks/useOffline', () => ({
  useOfflineOrder: vi.fn(),
  useOnlineStatus: vi.fn(),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockMenuItems: MenuItem[] = [
  {
    id: 1,
    name: 'French Fries S',
    price: 35,
    available: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 2,
    name: 'French Fries M',
    price: 45,
    available: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('CustomerOrder', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();

    // Default mock implementations
    vi.mocked(useMenuModule.useAllMenu).mockReturnValue({
      data: mockMenuItems,
      isLoading: false,
      isError: false,
    } as ReturnType<typeof useMenuModule.useAllMenu>);

    vi.mocked(useOfflineModule.useOnlineStatus).mockReturnValue(true);
    vi.mocked(useOfflineModule.useOfflineOrder).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      syncError: null,
      submitOrder: vi.fn().mockResolvedValue({
        order: {
          id: '1401001',
          customer_name: 'Test User',
          items: [{ menu_item_id: 1, name: 'French Fries S', price: 35, quantity: 1 }],
          total_amount: 35,
          status: 'PENDING_PAYMENT',
          created_at: '2026-01-14T10:00:00Z',
          date_key: 1401,
        },
      }),
      syncPendingOrders: vi.fn().mockResolvedValue({ synced: [], failed: [] }),
    } as ReturnType<typeof useOfflineModule.useOfflineOrder>);
  });

  it('renders loading state initially', () => {
    vi.mocked(useMenuModule.useAllMenu).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as ReturnType<typeof useMenuModule.useAllMenu>);

    render(<CustomerOrder />);

    expect(screen.getByText('กำลังโหลดเมนู...')).toBeInTheDocument();
  });

  it('renders error state when menu fails to load', () => {
    vi.mocked(useMenuModule.useAllMenu).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as ReturnType<typeof useMenuModule.useAllMenu>);

    render(<CustomerOrder />);

    expect(screen.getByText('ไม่สามารถโหลดเมนูได้')).toBeInTheDocument();
  });

  it('renders menu items when loaded', () => {
    render(<CustomerOrder />);

    expect(screen.getByText('French Fries S')).toBeInTheDocument();
    expect(screen.getByText('French Fries M')).toBeInTheDocument();
    expect(screen.getByText('฿35')).toBeInTheDocument();
    expect(screen.getByText('฿45')).toBeInTheDocument();
  });

  it('renders header with logo and title', () => {
    render(<CustomerOrder />);

    expect(screen.getByText('Bar Vidva')).toBeInTheDocument();
    expect(screen.getByText('Kaset Fair 2026')).toBeInTheDocument();
  });

  it('shows online status indicator', () => {
    render(<CustomerOrder />);

    expect(screen.getByText('ออนไลน์')).toBeInTheDocument();
  });

  it('shows offline status indicator when offline', () => {
    vi.mocked(useOfflineModule.useOnlineStatus).mockReturnValue(false);

    render(<CustomerOrder />);

    expect(screen.getByText('ออฟไลน์')).toBeInTheDocument();
    expect(
      screen.getByText('ออฟไลน์ - ออเดอร์จะถูกส่งเมื่อมีสัญญาณ')
    ).toBeInTheDocument();
  });

  it('allows adding items to cart', async () => {
    const user = userEvent.setup();

    render(<CustomerOrder />);

    const addButton = screen.getByRole('button', {
      name: /increase french fries s quantity/i,
    });
    await user.click(addButton);

    // Quantity should now be 1
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('allows entering customer name', async () => {
    const user = userEvent.setup();

    render(<CustomerOrder />);

    const nameInput = screen.getByPlaceholderText('กรอกชื่อของคุณ');
    await user.type(nameInput, 'สมชาย');

    expect(nameInput).toHaveValue('สมชาย');
  });

  it('disables submit button when cart is empty', () => {
    render(<CustomerOrder />);

    const submitButton = screen.getByRole('button', {
      name: /ยืนยันสั่งซื้อ/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it('disables submit button when name is invalid', async () => {
    const user = userEvent.setup();

    render(<CustomerOrder />);

    // Add item to cart
    const addButton = screen.getByRole('button', {
      name: /increase french fries s quantity/i,
    });
    await user.click(addButton);

    // Don't enter name - button should still be disabled
    const submitButton = screen.getByRole('button', {
      name: /ยืนยันสั่งซื้อ/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it('enables submit button when cart has items and name is valid', async () => {
    const user = userEvent.setup();

    render(<CustomerOrder />);

    // Add item to cart
    const addButton = screen.getByRole('button', {
      name: /increase french fries s quantity/i,
    });
    await user.click(addButton);

    // Enter valid name
    const nameInput = screen.getByPlaceholderText('กรอกชื่อของคุณ');
    await user.type(nameInput, 'John');

    // Button should be enabled
    const submitButton = screen.getByRole('button', {
      name: /ยืนยันสั่งซื้อ/i,
    });
    expect(submitButton).not.toBeDisabled();
  });

  it('submits order and navigates to payment page', async () => {
    const user = userEvent.setup();
    const mockSubmitOrder = vi.fn().mockResolvedValue({
      order: {
        id: '1401001',
        customer_name: 'John',
        items: [{ menu_item_id: 1, name: 'French Fries S', price: 35, quantity: 1 }],
        total_amount: 35,
        status: 'PENDING_PAYMENT',
        created_at: '2026-01-14T10:00:00Z',
        date_key: 1401,
      },
    });

    vi.mocked(useOfflineModule.useOfflineOrder).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      syncError: null,
      submitOrder: mockSubmitOrder,
      syncPendingOrders: vi.fn().mockResolvedValue({ synced: [], failed: [] }),
    } as ReturnType<typeof useOfflineModule.useOfflineOrder>);

    render(<CustomerOrder />);

    // Add item to cart
    const addButton = screen.getByRole('button', {
      name: /increase french fries s quantity/i,
    });
    await user.click(addButton);

    // Enter name
    const nameInput = screen.getByPlaceholderText('กรอกชื่อของคุณ');
    await user.type(nameInput, 'John');

    // Submit order
    const submitButton = screen.getByRole('button', {
      name: /ยืนยันสั่งซื้อ/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockSubmitOrder).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/payment/1401001');
    });
  });

  it('shows error message when order submission fails', async () => {
    const user = userEvent.setup();
    const mockSubmitOrder = vi.fn().mockRejectedValue(new Error('Network error'));

    vi.mocked(useOfflineModule.useOfflineOrder).mockReturnValue({
      isOnline: true,
      isSyncing: false,
      syncError: null,
      submitOrder: mockSubmitOrder,
      syncPendingOrders: vi.fn().mockResolvedValue({ synced: [], failed: [] }),
    } as ReturnType<typeof useOfflineModule.useOfflineOrder>);

    render(<CustomerOrder />);

    // Add item to cart
    const addButton = screen.getByRole('button', {
      name: /increase french fries s quantity/i,
    });
    await user.click(addButton);

    // Enter name
    const nameInput = screen.getByPlaceholderText('กรอกชื่อของคุณ');
    await user.type(nameInput, 'John');

    // Submit order
    const submitButton = screen.getByRole('button', {
      name: /ยืนยันสั่งซื้อ/i,
    });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('shows validation error for empty name on submit', async () => {
    const user = userEvent.setup();

    render(<CustomerOrder />);

    // Add item to cart
    const addButton = screen.getByRole('button', {
      name: /increase french fries s quantity/i,
    });
    await user.click(addButton);

    // Enter invalid name (too short)
    const nameInput = screen.getByPlaceholderText('กรอกชื่อของคุณ');
    await user.type(nameInput, 'A');
    await user.tab(); // Blur to trigger validation

    expect(
      screen.getByText('ชื่อต้องมีอย่างน้อย 2 ตัวอักษร')
    ).toBeInTheDocument();
  });

  it('calculates and displays correct total', async () => {
    const user = userEvent.setup();

    render(<CustomerOrder />);

    // Add 2x French Fries S (35 each)
    const addButtonS = screen.getByRole('button', {
      name: /increase french fries s quantity/i,
    });
    await user.click(addButtonS);
    await user.click(addButtonS);

    // Add 1x French Fries M (45 each)
    const addButtonM = screen.getByRole('button', {
      name: /increase french fries m quantity/i,
    });
    await user.click(addButtonM);

    // Total should be 35*2 + 45 = 115
    expect(screen.getByText('฿115')).toBeInTheDocument();
  });

  it('shows footer with payment instructions', () => {
    render(<CustomerOrder />);

    expect(screen.getByText('ชำระเงินผ่านพร้อมเพย์ที่บูธ')).toBeInTheDocument();
  });
});
