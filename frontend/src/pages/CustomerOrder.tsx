import { useState } from 'react';
import { useMenu } from '@/hooks/useMenu';
import { useOfflineOrder, useOnlineStatus } from '@/hooks/useOffline';
import { MenuSelector } from '@/components/MenuSelector';
import { NameInput } from '@/components/NameInput';
import { OrderSummary } from '@/components/OrderSummary';
import { PaymentInfo } from '@/components/PaymentInfo';
import type { CartItem, Order } from '@/types/api';
import type { PendingOrder } from '@/services/offline';
import {
  generateOrderId,
  getCurrentDay,
  validateCustomerName,
  cartToOrderItems,
  calculateTotal,
} from '@/utils/orderUtils';

export function CustomerOrder() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: menuItems, isLoading, isError: menuError } = useMenu();
  const { submitOrder, isSyncing } = useOfflineOrder();
  const onlineStatus = useOnlineStatus();

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
    setIsSubmitting(true);

    try {
      const day = getCurrentDay();
      const orderId = generateOrderId(day);

      const result = await submitOrder({
        id: orderId,
        customer_name: customerName.trim(),
        items: cartToOrderItems(cart),
        day,
      });

      if (result.order) {
        // Order was submitted online
        setSubmittedOrder(result.order);
      } else if (result.pending) {
        // Order was saved offline
        setPendingOrder(result.pending);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ไม่สามารถส่งคำสั่งซื้อได้');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset to new order
  const handleNewOrder = () => {
    setSubmittedOrder(null);
    setPendingOrder(null);
    setCart([]);
    setCustomerName('');
  };

  // Show payment info after successful order
  if (submittedOrder) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-md mx-auto">
          <PaymentInfo order={submittedOrder} />

          <button
            type="button"
            onClick={handleNewOrder}
            className="w-full mt-6 py-3 px-4 rounded-lg border-2 border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-colors"
          >
            สั่งซื้อเพิ่ม
          </button>
        </div>
      </div>
    );
  }

  // Show offline order confirmation
  if (pendingOrder) {
    const totalAmount = calculateTotal(cart);
    return (
      <div className="min-h-screen bg-gray-50 py-6 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-amber-800 mb-2">บันทึกออเดอร์แล้ว</h2>
            <p className="text-amber-700 mb-4">
              ออเดอร์ของคุณถูกบันทึกไว้ในเครื่อง และจะถูกส่งอัตโนมัติเมื่อมีสัญญาณอินเทอร์เน็ต
            </p>

            <div className="bg-white rounded-lg p-4 mb-4 text-left">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">รหัสออเดอร์</span>
                <span className="text-2xl font-bold text-gray-900">{pendingOrder.id}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">ชื่อ</span>
                <span className="text-gray-900">{pendingOrder.orderData.customer_name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">ยอดรวม</span>
                <span className="text-xl font-bold text-orange-600">{totalAmount.toFixed(0)} บาท</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-amber-600 mb-4">
              {isSyncing ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full" />
                  <span className="text-sm">กำลังส่งออเดอร์...</span>
                </>
              ) : !onlineStatus ? (
                <>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-sm">รอสัญญาณอินเทอร์เน็ต</span>
                </>
              ) : (
                <span className="text-sm text-green-600">เชื่อมต่อแล้ว กำลังส่ง...</span>
              )}
            </div>

            <p className="text-sm text-amber-600 mb-4">
              กรุณารอที่บูธเพื่อยืนยันการชำระเงินหลังออเดอร์ถูกส่ง
            </p>
          </div>

          <button
            type="button"
            onClick={handleNewOrder}
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
      {/* Offline Banner */}
      {!onlineStatus && (
        <div className="bg-amber-500 text-white px-4 py-2 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>ออฟไลน์ - ออเดอร์จะถูกส่งเมื่อมีสัญญาณ</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-orange-500 text-white py-4 px-4 shadow-md">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <img src="/images/logo.svg" alt="Bar Vidva" className="h-10" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">Bar Vidva</h1>
            <p className="text-orange-100 text-sm">Kaset Fair 2026</p>
          </div>
          {/* Online/Offline indicator */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${
            onlineStatus ? 'bg-green-500/20 text-green-100' : 'bg-amber-500/20 text-amber-100'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              onlineStatus ? 'bg-green-400' : 'bg-amber-400 animate-pulse'
            }`} />
            {onlineStatus ? 'ออนไลน์' : 'ออฟไลน์'}
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
          isSubmitting={isSubmitting}
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
