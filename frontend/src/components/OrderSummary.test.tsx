import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { OrderSummary } from './OrderSummary';
import type { CartItem } from '@/types/api';

const mockCartItems: CartItem[] = [
  { menu_item_id: 1, name: 'French Fries S', price: 35, quantity: 2 },
  { menu_item_id: 2, name: 'French Fries M', price: 45, quantity: 1 },
];

describe('OrderSummary', () => {
  it('renders section title', () => {
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={[]}
        onSubmit={onSubmit}
        isSubmitting={false}
        disabled={false}
      />
    );

    expect(screen.getByText('สรุปรายการ')).toBeInTheDocument();
  });

  it('shows empty state when cart is empty', () => {
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={[]}
        onSubmit={onSubmit}
        isSubmitting={false}
        disabled={false}
      />
    );

    expect(screen.getByText('ยังไม่ได้เลือกรายการ')).toBeInTheDocument();
  });

  it('displays cart items with quantities and subtotals', () => {
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={mockCartItems}
        onSubmit={onSubmit}
        isSubmitting={false}
        disabled={false}
      />
    );

    expect(screen.getByText('French Fries S')).toBeInTheDocument();
    expect(screen.getByText('x2')).toBeInTheDocument();
    expect(screen.getByText('฿70')).toBeInTheDocument(); // 35 * 2

    expect(screen.getByText('French Fries M')).toBeInTheDocument();
    expect(screen.getByText('x1')).toBeInTheDocument();
    expect(screen.getByText('฿45')).toBeInTheDocument();
  });

  it('displays correct total amount', () => {
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={mockCartItems}
        onSubmit={onSubmit}
        isSubmitting={false}
        disabled={false}
      />
    );

    // Total: 35*2 + 45*1 = 115
    expect(screen.getByText('฿115')).toBeInTheDocument();
    expect(screen.getByText('รวม')).toBeInTheDocument();
  });

  it('shows submit button with total in text', () => {
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={mockCartItems}
        onSubmit={onSubmit}
        isSubmitting={false}
        disabled={false}
      />
    );

    expect(
      screen.getByRole('button', { name: /ยืนยันสั่งซื้อ - ฿115/i })
    ).toBeInTheDocument();
  });

  it('calls onSubmit when button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={mockCartItems}
        onSubmit={onSubmit}
        isSubmitting={false}
        disabled={false}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /ยืนยันสั่งซื้อ/i,
    });
    await user.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('disables button when disabled prop is true', () => {
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={mockCartItems}
        onSubmit={onSubmit}
        isSubmitting={false}
        disabled={true}
      />
    );

    const submitButton = screen.getByRole('button', {
      name: /ยืนยันสั่งซื้อ/i,
    });
    expect(submitButton).toBeDisabled();
  });

  it('disables button when isSubmitting is true', () => {
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={mockCartItems}
        onSubmit={onSubmit}
        isSubmitting={true}
        disabled={false}
      />
    );

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('disables button when cart is empty', () => {
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={[]}
        onSubmit={onSubmit}
        isSubmitting={false}
        disabled={false}
      />
    );

    const submitButton = screen.getByRole('button');
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state when isSubmitting is true', () => {
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={mockCartItems}
        onSubmit={onSubmit}
        isSubmitting={true}
        disabled={false}
      />
    );

    expect(screen.getByText('กำลังดำเนินการ...')).toBeInTheDocument();
  });

  it('does not call onSubmit when button is disabled', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={mockCartItems}
        onSubmit={onSubmit}
        isSubmitting={false}
        disabled={true}
      />
    );

    const submitButton = screen.getByRole('button');
    await user.click(submitButton);

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows zero total when cart is empty', () => {
    const onSubmit = vi.fn();

    render(
      <OrderSummary
        items={[]}
        onSubmit={onSubmit}
        isSubmitting={false}
        disabled={false}
      />
    );

    // Button should show ฿0
    expect(
      screen.getByRole('button', { name: /ยืนยันสั่งซื้อ - ฿0/i })
    ).toBeInTheDocument();
  });
});
