import { useState } from 'react';
import { useMenu } from '@/hooks/useMenu';
import { useCreateOrder } from '@/hooks/useOrders';
import { MenuSelector } from '@/components/MenuSelector';
import { NameInput } from '@/components/NameInput';
import { OrderSummary } from '@/components/OrderSummary';
import { PaymentInfo } from '@/components/PaymentInfo';
import type { CartItem, Order } from '@/types/api';
import {
  generateOrderId,
  getCurrentDay,
  validateCustomerName,
  cartToOrderItems,
} from '@/utils/orderUtils';

export function CustomerOrder() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: menuItems, isLoading, isError: menuError } = useMenu();
  const createOrder = useCreateOrder();

  const handleSubmit = async () => {
    // Validate
    const nameError = validateCustomerName(customerName);
    if (nameError) {
      setError(nameError);
      return;
    }

    if (cart.length === 0) {
      setError('กรุณาเลือกอย่างน้อย 1 รายการ');
      return;
    }

    setError(null);

    try {
      const day = getCurrentDay();
      const orderId = generateOrderId(day);

      const order = await createOrder.mutateAsync({
        id: orderId,
        customer_name: customerName.trim(),
        items: cartToOrderItems(cart),
        day,
      });

      setSubmittedOrder(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถส่งคำสั่งซื้อได้');
    }
  };

  // Show payment info after successful order
  if (submittedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-md mx-auto">
          <PaymentInfo order={submittedOrder} />

          <button
            type="button"
            onClick={() => {
              setSubmittedOrder(null);
              setCart([]);
              setCustomerName('');
            }}
            className="w-full mt-6 py-3 px-4 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            สั่งซื้อเพิ่ม
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-gray-600">กำลังโหลดเมนู...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (menuError || !menuItems) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-red-50 rounded-lg p-6 max-w-sm">
          <div className="text-red-500 text-4xl mb-4">!</div>
          <h2 className="text-lg font-bold text-red-800">ไม่สามารถโหลดเมนูได้</h2>
          <p className="text-red-600 mt-2">
            กรุณาตรวจสอบการเชื่อมต่อและลองใหม่อีกครั้ง
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  const hasValidName = !validateCustomerName(customerName);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-500 text-white py-4 px-4 shadow-md">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <img src="/images/logo.svg" alt="Bar Vidva" className="h-10" />
          <div>
            <h1 className="text-xl font-bold">Bar Vidva</h1>
            <p className="text-orange-100 text-sm">Kaset Fair 2026</p>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-md mx-auto py-6 px-4 space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Menu selection */}
        <MenuSelector items={menuItems} cart={cart} onUpdateCart={setCart} />

        {/* Name input */}
        <NameInput
          value={customerName}
          onChange={setCustomerName}
          error={error?.includes('name') ? error : null}
        />

        {/* Order summary */}
        <OrderSummary
          items={cart}
          onSubmit={handleSubmit}
          isSubmitting={createOrder.isPending}
          disabled={!hasValidName || cart.length === 0}
        />
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-gray-500 text-sm">
        <p>ชำระเงินผ่านพร้อมเพย์ที่บูธ</p>
      </footer>
    </div>
  );
}
