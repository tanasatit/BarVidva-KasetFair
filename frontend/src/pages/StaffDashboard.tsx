import { useState } from 'react';
import { StaffProvider, useStaffAuth } from '@/context/StaffContext';
import { StaffLogin } from '@/components/StaffLogin';
import {
  usePendingOrders,
  useQueueOrders,
  useCompletedOrders,
  useVerifyPayment,
  useCompleteOrder,
  useCancelOrder,
} from '@/hooks/useStaff';
import type { Order } from '@/types/api';
import { formatPrice } from '@/utils/orderUtils';

type TabType = 'pending' | 'queue' | 'completed';

function StaffDashboardContent() {
  const { isAuthenticated, isLoading: authLoading, logout } = useStaffAuth();
  const [activeTab, setActiveTab] = useState<TabType>('pending');

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <StaffLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/images/logo.svg" alt="Bar Vidva" className="h-10" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Staff Dashboard</h1>
                <p className="text-sm text-gray-500">Bar Vidva - Kaset Fair</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            <TabButton
              active={activeTab === 'pending'}
              onClick={() => setActiveTab('pending')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="รอชำระเงิน"
            />
            <TabButton
              active={activeTab === 'queue'}
              onClick={() => setActiveTab('queue')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              }
              label="คิวกำลังทำ"
            />
            <TabButton
              active={activeTab === 'completed'}
              onClick={() => setActiveTab('completed')}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              label="เสร็จสิ้น"
            />
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'pending' && <PendingTab />}
        {activeTab === 'queue' && <QueueTab />}
        {activeTab === 'completed' && <CompletedTab />}
      </main>
    </div>
  );
}

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function TabButton({ active, onClick, icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
        active
          ? 'border-orange-500 text-orange-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function PendingTab() {
  const { data: orders, isLoading, error } = usePendingOrders();
  const verifyPayment = useVerifyPayment();
  const cancelOrder = useCancelOrder();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        title="ไม่มีออเดอร์รอชำระเงิน"
        description="ออเดอร์ใหม่จะแสดงที่นี่"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          รอชำระเงิน ({orders.length} รายการ)
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            actions={
              <div className="flex gap-2">
                <button
                  onClick={() => cancelOrder.mutate(order.id)}
                  disabled={cancelOrder.isPending}
                  className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => verifyPayment.mutate(order.id)}
                  disabled={verifyPayment.isPending}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50"
                >
                  ยืนยันชำระเงิน
                </button>
              </div>
            }
          />
        ))}
      </div>
    </div>
  );
}

function QueueTab() {
  const { data: orders, isLoading, error } = useQueueOrders();
  const completeOrder = useCompleteOrder();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        }
        title="ไม่มีออเดอร์ในคิว"
        description="ออเดอร์ที่ชำระเงินแล้วจะแสดงที่นี่"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          คิวกำลังทำ ({orders.length} รายการ)
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            showQueueNumber
            actions={
              <button
                onClick={() => completeOrder.mutate(order.id)}
                disabled={completeOrder.isPending}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50"
              >
                เสร็จสิ้น - เรียกรับอาหาร
              </button>
            }
          />
        ))}
      </div>
    </div>
  );
}

function CompletedTab() {
  const { data: orders, isLoading, error } = useCompletedOrders();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error.message} />;
  }

  if (!orders || orders.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        }
        title="ยังไม่มีออเดอร์เสร็จสิ้น"
        description="ออเดอร์ที่เสร็จแล้วจะแสดงที่นี่"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          เสร็จสิ้นวันนี้ ({orders.length} รายการ)
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} showQueueNumber completed />
        ))}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  showQueueNumber?: boolean;
  completed?: boolean;
  actions?: React.ReactNode;
}

function OrderCard({ order, showQueueNumber, completed, actions }: OrderCardProps) {
  const createdAt = new Date(order.created_at);
  const timeAgo = getTimeAgo(createdAt);

  return (
    <div
      className={`bg-white rounded-xl border ${
        completed ? 'border-gray-200 opacity-75' : 'border-gray-200 shadow-sm'
      } overflow-hidden`}
    >
      {/* Header */}
      <div className={`px-4 py-3 ${showQueueNumber ? 'bg-orange-50' : 'bg-gray-50'}`}>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500">Order ID</span>
            <p className="text-lg font-bold text-gray-900">{order.id}</p>
          </div>
          {showQueueNumber && order.queue_number && (
            <div className="text-right">
              <span className="text-xs text-orange-600">Queue</span>
              <p className="text-2xl font-bold text-orange-600">#{order.queue_number}</p>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Customer Name */}
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          <span className="font-medium text-gray-900">{order.customer_name}</span>
        </div>

        {/* Items */}
        <div className="space-y-1">
          {order.items.map((item, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {item.name} x{item.quantity}
              </span>
              <span className="text-gray-900">{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="pt-2 border-t border-gray-100 flex justify-between">
          <span className="font-medium text-gray-900">รวม</span>
          <span className="font-bold text-lg text-orange-600">
            {formatPrice(order.total_amount)}
          </span>
        </div>

        {/* Time */}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{timeAgo}</span>
        </div>
      </div>

      {/* Actions */}
      {actions && <div className="px-4 pb-4">{actions}</div>}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500">กำลังโหลด...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <p className="text-red-600 font-medium">เกิดข้อผิดพลาด</p>
        <p className="text-gray-500 text-sm mt-1">{message}</p>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="text-gray-300 mb-4 flex justify-center">{icon}</div>
        <p className="text-gray-900 font-medium">{title}</p>
        <p className="text-gray-500 text-sm mt-1">{description}</p>
      </div>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;

  return date.toLocaleDateString('th-TH', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StaffDashboard() {
  return (
    <StaffProvider>
      <StaffDashboardContent />
    </StaffProvider>
  );
}
