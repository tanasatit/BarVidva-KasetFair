import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrder, useQueue } from '@/hooks/useOrders';
import type { Order, OrderStatus } from '@/types/api';
import { formatPrice } from '@/utils/orderUtils';

// Status configuration for display
const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; labelTh: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
  PENDING_PAYMENT: {
    label: 'Pending Payment',
    labelTh: 'รอชำระเงิน',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  PAID: {
    label: 'In Queue',
    labelTh: 'อยู่ในคิว',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  READY: {
    label: 'Ready for Pickup',
    labelTh: 'พร้อมรับ',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
  COMPLETED: {
    label: 'Completed',
    labelTh: 'เสร็จสิ้น',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  CANCELLED: {
    label: 'Cancelled',
    labelTh: 'ยกเลิก',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
};

function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diffHours / 24)} วันที่แล้ว`;
}

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full" />
      <p className="mt-4 text-gray-600">กำลังโหลด...</p>
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
    </div>
  );
}

interface QueuePositionProps {
  order: Order;
  queueOrders: Order[];
}

function QueuePosition({ order, queueOrders }: QueuePositionProps) {
  // Find position in queue (orders with PAID status, sorted by queue_number)
  const activeQueue = queueOrders
    .filter((o) => o.status === 'PAID' && o.queue_number !== undefined)
    .sort((a, b) => (a.queue_number ?? 0) - (b.queue_number ?? 0));

  const position = activeQueue.findIndex((o) => o.id === order.id) + 1;
  const totalInQueue = activeQueue.length;

  if (position === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 rounded-xl p-6 text-center">
      <p className="text-blue-600 text-sm font-medium mb-1">ตำแหน่งในคิว</p>
      <div className="flex items-center justify-center gap-2">
        <span className="text-5xl font-bold text-blue-700">{position}</span>
        <span className="text-2xl text-blue-400">/</span>
        <span className="text-2xl text-blue-500">{totalInQueue}</span>
      </div>
      {position === 1 && (
        <p className="text-blue-600 text-sm mt-2 font-medium">คุณเป็นคิวถัดไป!</p>
      )}
      {position > 1 && (
        <p className="text-blue-500 text-sm mt-2">รออีก {position - 1} คิว</p>
      )}
    </div>
  );
}

interface OrderStatusDisplayProps {
  order: Order;
  queueOrders: Order[];
}

function OrderStatusDisplay({ order, queueOrders }: OrderStatusDisplayProps) {
  const config = STATUS_CONFIG[order.status];

  return (
    <div className="space-y-6">
      {/* Status Badge */}
      <div className={`${config.bgColor} rounded-xl p-6 text-center`}>
        <div className={`${config.color} w-16 h-16 mx-auto mb-3 flex items-center justify-center`}>
          {config.icon}
        </div>
        <h2 className={`text-2xl font-bold ${config.color}`}>{config.labelTh}</h2>
        <p className="text-gray-500 text-sm mt-1">{config.label}</p>
      </div>

      {/* Queue Number (if assigned) */}
      {order.queue_number && (
        <div className="bg-orange-50 rounded-xl p-6 text-center">
          <p className="text-orange-600 text-sm font-medium mb-1">หมายเลขคิว</p>
          <p className="text-6xl font-bold text-orange-600">{order.queue_number}</p>
        </div>
      )}

      {/* Queue Position (for PAID status) */}
      {order.status === 'PAID' && <QueuePosition order={order} queueOrders={queueOrders} />}

      {/* Ready for Pickup Alert */}
      {order.status === 'READY' && (
        <div className="bg-green-50 border-2 border-green-500 rounded-xl p-6 text-center animate-pulse">
          <p className="text-green-700 font-bold text-lg">กรุณามารับอาหารที่บูธ</p>
          <p className="text-green-600 text-sm mt-1">เรียกหมายเลขคิว {order.queue_number}</p>
        </div>
      )}

      {/* Status-specific messages */}
      {order.status === 'PENDING_PAYMENT' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-yellow-800 text-sm">
            กรุณาชำระเงินและแสดงสลิปให้พนักงาน
            <br />
            ออเดอร์จะถูกยกเลิกอัตโนมัติหลังจาก 10 นาที
          </p>
        </div>
      )}

      {order.status === 'CANCELLED' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-700 text-sm">
            ออเดอร์นี้ถูกยกเลิกแล้ว กรุณาสั่งใหม่หากต้องการ
          </p>
        </div>
      )}

      {order.status === 'COMPLETED' && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-gray-600 text-sm">
            ขอบคุณที่ใช้บริการ Bar Vidva!
            {order.completed_at && (
              <span className="block mt-1">
                รับอาหารเมื่อ {getTimeAgo(order.completed_at)}
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

interface OrderDetailsProps {
  order: Order;
}

function OrderDetails({ order }: OrderDetailsProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <h3 className="font-bold text-gray-900">รายละเอียดออเดอร์</h3>
      </div>
      <div className="p-4 space-y-4">
        {/* Customer Info */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500">ชื่อลูกค้า</span>
          <span className="font-medium text-gray-900">{order.customer_name}</span>
        </div>

        {/* Order ID */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500">หมายเลขออเดอร์</span>
          <span className="font-mono font-bold text-orange-600">{order.id}</span>
        </div>

        {/* Order Time */}
        <div className="flex justify-between items-center">
          <span className="text-gray-500">เวลาสั่ง</span>
          <span className="text-gray-700">{getTimeAgo(order.created_at)}</span>
        </div>

        {/* Items */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-gray-500 text-sm mb-2">รายการ</p>
          <div className="space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-gray-700">
                  {item.name} x{item.quantity}
                </span>
                <span className="text-gray-900">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total */}
        <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
          <span className="font-bold text-gray-900">รวมทั้งหมด</span>
          <span className="font-bold text-xl text-orange-600">
            {formatPrice(order.total_amount)}
          </span>
        </div>
      </div>
    </div>
  );
}

function OrderSearchForm({
  onSearch,
  initialValue,
}: {
  onSearch: (orderId: string) => void;
  initialValue: string;
}) {
  const [inputValue, setInputValue] = useState(initialValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed) {
      onSearch(trimmed);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="orderId" className="block text-sm font-medium text-gray-700 mb-2">
          หมายเลขออเดอร์
        </label>
        <input
          type="text"
          id="orderId"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="เช่น 1001001"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-center text-2xl font-mono tracking-wider"
          maxLength={6}
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        className="w-full px-4 py-3 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 active:bg-orange-700 transition-colors disabled:opacity-50"
        disabled={!inputValue.trim()}
      >
        ค้นหาออเดอร์
      </button>
    </form>
  );
}

export function QueueTracker() {
  const { orderId: urlOrderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [searchedOrderId, setSearchedOrderId] = useState<string | null>(urlOrderId || null);

  // Fetch order data (polls every 5 seconds)
  const {
    data: order,
    isLoading: orderLoading,
    error: orderError,
  } = useOrder(searchedOrderId);

  // Fetch queue data for position calculation
  const { data: queueOrders = [] } = useQueue();

  // Update URL when searching
  const handleSearch = (orderId: string) => {
    setSearchedOrderId(orderId);
    navigate(`/queue/${orderId}`, { replace: true });
  };

  // Sync URL param with state
  useEffect(() => {
    if (urlOrderId && urlOrderId !== searchedOrderId) {
      setSearchedOrderId(urlOrderId);
    }
  }, [urlOrderId, searchedOrderId]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/images/logo.svg" alt="Bar Vidva" className="h-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">ติดตามออเดอร์</h1>
                <p className="text-sm text-gray-500">Bar Vidva - Kaset Fair</p>
              </div>
            </div>
            <a
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span className="text-sm font-medium">สั่งใหม่</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Search Form */}
        {!searchedOrderId && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <OrderSearchForm onSearch={handleSearch} initialValue="" />
          </div>
        )}

        {/* Order Display */}
        {searchedOrderId && (
          <>
            {/* Search again link */}
            <button
              onClick={() => {
                setSearchedOrderId(null);
                navigate('/queue');
              }}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <span className="text-sm">ค้นหาออเดอร์อื่น</span>
            </button>

            {/* Loading State */}
            {orderLoading && <LoadingSpinner />}

            {/* Error State */}
            {orderError && <OrderNotFound orderId={searchedOrderId} />}

            {/* Order Found */}
            {order && (
              <div className="space-y-6">
                <OrderStatusDisplay order={order} queueOrders={queueOrders} />
                <OrderDetails order={order} />

                {/* Auto-refresh indicator */}
                <div className="text-center">
                  <p className="text-gray-400 text-xs flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    อัปเดตอัตโนมัติทุก 5 วินาที
                  </p>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
