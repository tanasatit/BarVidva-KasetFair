import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { MenuSelector } from './MenuSelector';
import type { MenuItem, CartItem } from '@/types/api';

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
  {
    id: 3,
    name: 'French Fries L',
    price: 55,
    available: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

describe('MenuSelector', () => {
  it('renders menu items correctly', () => {
    const onUpdateCart = vi.fn();

    render(
      <MenuSelector
        items={mockMenuItems}
        cart={[]}
        onUpdateCart={onUpdateCart}
      />
    );

    expect(screen.getByText('เลือกเมนู')).toBeInTheDocument();
    expect(screen.getByText('French Fries S')).toBeInTheDocument();
    expect(screen.getByText('French Fries M')).toBeInTheDocument();
    expect(screen.getByText('฿35')).toBeInTheDocument();
    expect(screen.getByText('฿45')).toBeInTheDocument();
  });

  it('shows unavailable items when showUnavailable is true', () => {
    const onUpdateCart = vi.fn();

    render(
      <MenuSelector
        items={mockMenuItems}
        cart={[]}
        onUpdateCart={onUpdateCart}
        showUnavailable={true}
      />
    );

    expect(screen.getByText('French Fries L')).toBeInTheDocument();
    expect(screen.getByText('หมด')).toBeInTheDocument();
  });

  it('hides unavailable items when showUnavailable is false', () => {
    const onUpdateCart = vi.fn();

    render(
      <MenuSelector
        items={mockMenuItems}
        cart={[]}
        onUpdateCart={onUpdateCart}
        showUnavailable={false}
      />
    );

    expect(screen.queryByText('French Fries L')).not.toBeInTheDocument();
  });

  it('increases quantity when + button is clicked', async () => {
    const user = userEvent.setup();
    const onUpdateCart = vi.fn();

    render(
      <MenuSelector
        items={mockMenuItems}
        cart={[]}
        onUpdateCart={onUpdateCart}
      />
    );

    const addButton = screen.getByRole('button', {
      name: /increase french fries s quantity/i,
    });
    await user.click(addButton);

    expect(onUpdateCart).toHaveBeenCalledWith([
      { menu_item_id: 1, name: 'French Fries S', price: 35, quantity: 1 },
    ]);
  });

  it('decreases quantity when - button is clicked', async () => {
    const user = userEvent.setup();
    const onUpdateCart = vi.fn();
    const cart: CartItem[] = [
      { menu_item_id: 1, name: 'French Fries S', price: 35, quantity: 2 },
    ];

    render(
      <MenuSelector
        items={mockMenuItems}
        cart={cart}
        onUpdateCart={onUpdateCart}
      />
    );

    const decreaseButton = screen.getByRole('button', {
      name: /decrease french fries s quantity/i,
    });
    await user.click(decreaseButton);

    expect(onUpdateCart).toHaveBeenCalledWith([
      { menu_item_id: 1, name: 'French Fries S', price: 35, quantity: 1 },
    ]);
  });

  it('removes item from cart when quantity reaches 0', async () => {
    const user = userEvent.setup();
    const onUpdateCart = vi.fn();
    const cart: CartItem[] = [
      { menu_item_id: 1, name: 'French Fries S', price: 35, quantity: 1 },
    ];

    render(
      <MenuSelector
        items={mockMenuItems}
        cart={cart}
        onUpdateCart={onUpdateCart}
      />
    );

    const decreaseButton = screen.getByRole('button', {
      name: /decrease french fries s quantity/i,
    });
    await user.click(decreaseButton);

    expect(onUpdateCart).toHaveBeenCalledWith([]);
  });

  it('does not exceed max quantity of 10', () => {
    const onUpdateCart = vi.fn();
    const cart: CartItem[] = [
      { menu_item_id: 1, name: 'French Fries S', price: 35, quantity: 10 },
    ];

    render(
      <MenuSelector
        items={mockMenuItems}
        cart={cart}
        onUpdateCart={onUpdateCart}
      />
    );

    const addButton = screen.getByRole('button', {
      name: /increase french fries s quantity/i,
    });

    expect(addButton).toBeDisabled();
  });

  it('disables decrease button when quantity is 0', () => {
    const onUpdateCart = vi.fn();

    render(
      <MenuSelector
        items={mockMenuItems}
        cart={[]}
        onUpdateCart={onUpdateCart}
      />
    );

    const decreaseButton = screen.getByRole('button', {
      name: /decrease french fries s quantity/i,
    });

    expect(decreaseButton).toBeDisabled();
  });

  it('displays current quantity for items in cart', () => {
    const onUpdateCart = vi.fn();
    const cart: CartItem[] = [
      { menu_item_id: 1, name: 'French Fries S', price: 35, quantity: 3 },
    ];

    render(
      <MenuSelector
        items={mockMenuItems}
        cart={cart}
        onUpdateCart={onUpdateCart}
      />
    );

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('highlights selected items', () => {
    const onUpdateCart = vi.fn();
    const cart: CartItem[] = [
      { menu_item_id: 1, name: 'French Fries S', price: 35, quantity: 1 },
    ];

    const { container } = render(
      <MenuSelector
        items={mockMenuItems}
        cart={cart}
        onUpdateCart={onUpdateCart}
      />
    );

    // Check for orange border on selected item
    const selectedItem = container.querySelector('.border-orange-500');
    expect(selectedItem).toBeInTheDocument();
  });
});
