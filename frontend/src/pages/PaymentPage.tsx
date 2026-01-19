import { useParams, Link } from 'react-router-dom';
import { useOrder } from '@/hooks/useOrders';
import { PaymentInfo } from '@/components/PaymentInfo';

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
      <p className="mt-4 text-gray-600">กำลังโหลดข้อมูลออเดอร์...</p>
    </div>
  );
}

function OrderNotFound({ orderId }: { orderId: string }) {
  return (
    <div className="text-center py-12">
      <div className="bg-red-100 text-red-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่พบออเดอร์</h2>
      <p className="text-gray-600">
        ไม่พบออเดอร์หมายเลข <span className="font-mono font-bold">{orderId}</span>
      </p>
      <p className="text-gray-500 text-sm mt-2">กรุณาตรวจสอบหมายเลขออเดอร์อีกครั้ง</p>
      <Link
        to="/"
        className="inline-block mt-6 px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
      >
        สั่งซื้อใหม่
      </Link>
    </div>
  );
}

function NoOrderId() {
  return (
    <div className="text-center py-12">
      <div className="bg-yellow-100 text-yellow-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">ไม่มีหมายเลขออเดอร์</h2>
      <p className="text-gray-600">กรุณาสั่งซื้อเพื่อรับหมายเลขออเดอร์</p>
      <Link
        to="/"
        className="inline-block mt-6 px-6 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition-colors"
      >
        สั่งซื้อเลย
      </Link>
    </div>
  );
}

export function PaymentPage() {
  const { orderId } = useParams<{ orderId: string }>();

  // Fetch order data
  const { data: order, isLoading, error } = useOrder(orderId || null);

  // If order is already paid, show message to check queue instead
  const isPendingPayment = order?.status === 'PENDING_PAYMENT';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-orange-500 text-white py-4 px-4 shadow-md">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <img src="/images/logo.svg" alt="Bar Vidva" className="h-10" />
          <div className="flex-1">
            <h1 className="text-xl font-bold">Bar Vidva</h1>
            <p className="text-orange-100 text-sm">ชำระเงิน</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto py-6 px-4">
        {/* No order ID in URL */}
        {!orderId && <NoOrderId />}

        {/* Loading State */}
        {orderId && isLoading && <LoadingSpinner />}

        {/* Error / Not Found */}
        {orderId && error && <OrderNotFound orderId={orderId} />}

        {/* Order Found - Show Payment Info */}
        {order && isPendingPayment && (
          <>
            <PaymentInfo order={order} />

            <Link
              to="/"
              className="block w-full mt-6 py-3 px-4 rounded-lg border-2 border-gray-300 text-gray-700 font-medium text-center hover:bg-gray-100 transition-colors"
            >
              สั่งซื้อเพิ่ม
            </Link>
          </>
        )}

        {/* Order is already paid or in different status */}
        {order && !isPendingPayment && (
          <div className="text-center space-y-6">
            <div className="bg-blue-100 text-blue-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div>
              <h2 className="text-xl font-bold text-gray-900">ออเดอร์ชำระเงินแล้ว</h2>
              <p className="text-gray-600 mt-2">
                ออเดอร์ <span className="font-mono font-bold text-orange-600">{order.id}</span> ถูกยืนยันการชำระเงินแล้ว
              </p>
            </div>

            <Link
              to={`/queue/${order.id}`}
              className="block w-full px-4 py-3 bg-orange-500 text-white font-medium rounded-lg text-center hover:bg-orange-600 transition-colors"
            >
              ติดตามสถานะออเดอร์
            </Link>

            <Link
              to="/"
              className="block w-full py-3 px-4 rounded-lg border-2 border-gray-300 text-gray-700 font-medium text-center hover:bg-gray-100 transition-colors"
            >
              สั่งซื้อเพิ่ม
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
