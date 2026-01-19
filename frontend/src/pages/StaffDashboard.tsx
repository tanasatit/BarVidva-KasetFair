import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
type ModalType = 'verify' | 'cancel' | null;

type ViewMode = 'tabs' | 'split';

const STAFF_VIEW_MODE_KEY = 'staff-dashboard-view-mode';
const STAFF_TAB_KEY = 'staff-dashboard-tab';

function StaffDashboardContent() {
  const { isAuthenticated, isLoading: authLoading, logout } = useStaffAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem(STAFF_TAB_KEY);
    return (saved as TabType) || 'pending';
  });
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(STAFF_VIEW_MODE_KEY);
    return (saved as ViewMode) || 'split';
  });
  const [searchQuery, setSearchQuery] = useState('');

  // Persist state
  useEffect(() => {
    localStorage.setItem(STAFF_VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem(STAFF_TAB_KEY, activeTab);
  }, [activeTab]);

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
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('split')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'split'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="แบ่ง 2 ฝั่ง"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                  <span className="hidden md:inline">แบ่งจอ</span>
                </button>
                <button
                  onClick={() => setViewMode('tabs')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'tabs'
                      ? 'bg-white text-orange-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title="แท็บเดียว"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  <span className="hidden md:inline">แท็บ</span>
                </button>
              </div>
              {/* Admin Dashboard Button */}
              <button
                onClick={() => navigate('/admin')}
                className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Admin</span>
              </button>
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
        </div>
      </header>

      {/* Tab Navigation - Only show in tabs mode */}
      {viewMode === 'tabs' && (
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
      )}

      {/* Search Bar */}
      <div className={`${viewMode === 'split' ? 'max-w-full' : 'max-w-7xl'} mx-auto px-4 pt-4`}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหา Order ID หรือชื่อลูกค้า..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'split' ? (
        /* Split View - Side by Side */
        <main className="px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left Panel - Pending Orders */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-amber-50 border-b border-amber-100 px-4 py-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="font-semibold text-amber-800">รอชำระเงิน</h2>
              </div>
              <div className="p-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                <PendingTabCompact searchQuery={searchQuery} />
              </div>
            </div>

            {/* Right Panel - Queue Orders */}
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-blue-50 border-b border-blue-100 px-4 py-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h2 className="font-semibold text-blue-800">คิวกำลังทำ</h2>
              </div>
              <div className="p-4 max-h-[calc(100vh-220px)] overflow-y-auto">
                <QueueTabCompact searchQuery={searchQuery} />
              </div>
            </div>
          </div>

          {/* Completed Orders Link */}
          <div className="mt-4 text-center">
            <button
              onClick={() => setViewMode('tabs')}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ดูออเดอร์เสร็จสิ้น
            </button>
          </div>
        </main>
      ) : (
        /* Tab View */
        <main className="max-w-7xl mx-auto px-4 py-4">
          {activeTab === 'pending' && <PendingTab searchQuery={searchQuery} />}
          {activeTab === 'queue' && <QueueTab searchQuery={searchQuery} />}
          {activeTab === 'completed' && <CompletedTab searchQuery={searchQuery} />}
        </main>
      )}
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

interface TabProps {
  searchQuery: string;
}

function PendingTab({ searchQuery }: TabProps) {
  const { data: orders, isLoading, error } = usePendingOrders();
  const verifyPayment = useVerifyPayment();
  const cancelOrder = useCancelOrder();
  const [modalState, setModalState] = useState<{ type: ModalType; order: Order | null }>({
    type: null,
    order: null,
  });

  // Filter and sort orders (FIFO - oldest first)
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let result = [...orders];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query)
      );
    }

    // Sort by oldest first (FIFO)
    result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return result;
  }, [orders, searchQuery]);

  const handleVerifyClick = (order: Order) => {
    setModalState({ type: 'verify', order });
  };

  const handleCancelClick = (order: Order) => {
    setModalState({ type: 'cancel', order });
  };

  const handleConfirmVerify = () => {
    if (modalState.order) {
      verifyPayment.mutate(modalState.order.id, {
        onSuccess: () => setModalState({ type: null, order: null }),
      });
    }
  };

  const handleConfirmCancel = () => {
    if (modalState.order) {
      cancelOrder.mutate(modalState.order.id, {
        onSuccess: () => setModalState({ type: null, order: null }),
      });
    }
  };

  const closeModal = () => {
    setModalState({ type: null, order: null });
  };

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
          รอชำระเงิน ({filteredOrders.length}{searchQuery && ` / ${orders.length}`} รายการ)
        </h2>
        <span className="text-xs text-gray-500">เรียงจากเก่า → ใหม่ (FIFO)</span>
      </div>

      {filteredOrders.length === 0 && searchQuery ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500">ไม่พบออเดอร์ที่ตรงกับการค้นหา</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              actions={
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCancelClick(order)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={() => handleVerifyClick(order)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                  >
                    ยืนยันชำระเงิน
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      {/* Verify Payment Modal */}
      {modalState.type === 'verify' && modalState.order && (
        <ConfirmModal
          title="ยืนยันการชำระเงิน"
          message="คุณต้องการยืนยันการชำระเงินสำหรับออเดอร์นี้หรือไม่?"
          order={modalState.order}
          confirmText="ยืนยันชำระเงิน"
          confirmStyle="success"
          onConfirm={handleConfirmVerify}
          onCancel={closeModal}
          isLoading={verifyPayment.isPending}
        />
      )}

      {/* Cancel Order Modal */}
      {modalState.type === 'cancel' && modalState.order && (
        <ConfirmModal
          title="ยกเลิกออเดอร์"
          message="คุณต้องการยกเลิกออเดอร์นี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้"
          order={modalState.order}
          confirmText="ยืนยันยกเลิก"
          confirmStyle="danger"
          onConfirm={handleConfirmCancel}
          onCancel={closeModal}
          isLoading={cancelOrder.isPending}
        />
      )}
    </div>
  );
}

function QueueTab({ searchQuery }: TabProps) {
  const { data: orders, isLoading, error } = useQueueOrders();
  const completeOrder = useCompleteOrder();

  // Filter and sort orders (FIFO - oldest first / by queue number)
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let result = [...orders];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        (order.queue_number && order.queue_number.toString().includes(query))
      );
    }

    // Sort by queue number (FIFO)
    result.sort((a, b) => (a.queue_number || 0) - (b.queue_number || 0));

    return result;
  }, [orders, searchQuery]);

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
          คิวกำลังทำ ({filteredOrders.length}{searchQuery && ` / ${orders.length}`} รายการ)
        </h2>
        <span className="text-xs text-gray-500">เรียงตามคิว (FIFO)</span>
      </div>

      {filteredOrders.length === 0 && searchQuery ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500">ไม่พบออเดอร์ที่ตรงกับการค้นหา</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
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
      )}
    </div>
  );
}

function CompletedTab({ searchQuery }: TabProps) {
  const { data: orders, isLoading, error } = useCompletedOrders();

  // Filter orders (most recent first for completed)
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let result = [...orders];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        (order.queue_number && order.queue_number.toString().includes(query))
      );
    }

    // Sort by completed time (most recent first for history)
    result.sort((a, b) => {
      const timeA = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const timeB = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return timeB - timeA;
    });

    return result;
  }, [orders, searchQuery]);

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
          เสร็จสิ้นวันนี้ ({filteredOrders.length}{searchQuery && ` / ${orders.length}`} รายการ)
        </h2>
        <span className="text-xs text-gray-500">เรียงจากล่าสุด</span>
      </div>

      {filteredOrders.length === 0 && searchQuery ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-gray-500">ไม่พบออเดอร์ที่ตรงกับการค้นหา</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} showQueueNumber completed />
          ))}
        </div>
      )}
    </div>
  );
}

// Compact versions for split view
function PendingTabCompact({ searchQuery }: TabProps) {
  const { data: orders, isLoading, error } = usePendingOrders();
  const verifyPayment = useVerifyPayment();
  const cancelOrder = useCancelOrder();
  const [modalState, setModalState] = useState<{ type: ModalType; order: Order | null }>({
    type: null,
    order: null,
  });

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let result = [...orders];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query)
      );
    }
    result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    return result;
  }, [orders, searchQuery]);

  const handleVerifyClick = (order: Order) => setModalState({ type: 'verify', order });
  const handleCancelClick = (order: Order) => setModalState({ type: 'cancel', order });
  const handleConfirmVerify = () => {
    if (modalState.order) {
      verifyPayment.mutate(modalState.order.id, {
        onSuccess: () => setModalState({ type: null, order: null }),
      });
    }
  };
  const handleConfirmCancel = () => {
    if (modalState.order) {
      cancelOrder.mutate(modalState.order.id, {
        onSuccess: () => setModalState({ type: null, order: null }),
      });
    }
  };
  const closeModal = () => setModalState({ type: null, order: null });

  if (isLoading) return <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>;
  if (error) return <div className="text-center py-8 text-red-500">เกิดข้อผิดพลาด</div>;

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-gray-500 text-sm">ไม่มีออเดอร์รอชำระ</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">{filteredOrders.length} รายการ</span>
        <span className="text-xs text-gray-400">FIFO</span>
      </div>
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <CompactOrderCard
            key={order.id}
            order={order}
            variant="pending"
            actions={
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleCancelClick(order)}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleVerifyClick(order)}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg transition-colors"
                >
                  ยืนยัน
                </button>
              </div>
            }
          />
        ))}
      </div>

      {modalState.type === 'verify' && modalState.order && (
        <ConfirmModal
          title="ยืนยันการชำระเงิน"
          message="คุณต้องการยืนยันการชำระเงินสำหรับออเดอร์นี้หรือไม่?"
          order={modalState.order}
          confirmText="ยืนยันชำระเงิน"
          confirmStyle="success"
          onConfirm={handleConfirmVerify}
          onCancel={closeModal}
          isLoading={verifyPayment.isPending}
        />
      )}
      {modalState.type === 'cancel' && modalState.order && (
        <ConfirmModal
          title="ยกเลิกออเดอร์"
          message="คุณต้องการยกเลิกออเดอร์นี้หรือไม่?"
          order={modalState.order}
          confirmText="ยืนยันยกเลิก"
          confirmStyle="danger"
          onConfirm={handleConfirmCancel}
          onCancel={closeModal}
          isLoading={cancelOrder.isPending}
        />
      )}
    </>
  );
}

function QueueTabCompact({ searchQuery }: TabProps) {
  const { data: orders, isLoading, error } = useQueueOrders();
  const completeOrder = useCompleteOrder();

  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    let result = [...orders];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customer_name.toLowerCase().includes(query) ||
        (order.queue_number && order.queue_number.toString().includes(query))
      );
    }
    result.sort((a, b) => (a.queue_number || 0) - (b.queue_number || 0));
    return result;
  }, [orders, searchQuery]);

  if (isLoading) return <div className="text-center py-8 text-gray-500">กำลังโหลด...</div>;
  if (error) return <div className="text-center py-8 text-red-500">เกิดข้อผิดพลาด</div>;

  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <p className="text-gray-500 text-sm">ไม่มีออเดอร์ในคิว</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">{filteredOrders.length} รายการ</span>
        <span className="text-xs text-gray-400">ตามคิว</span>
      </div>
      <div className="space-y-3">
        {filteredOrders.map((order) => (
          <CompactOrderCard
            key={order.id}
            order={order}
            variant="queue"
            actions={
              <button
                onClick={() => completeOrder.mutate(order.id)}
                disabled={completeOrder.isPending}
                className="w-full mt-2 px-3 py-2 text-xs font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors disabled:opacity-50"
              >
                เสร็จสิ้น
              </button>
            }
          />
        ))}
      </div>
    </>
  );
}

interface CompactOrderCardProps {
  order: Order;
  variant: 'pending' | 'queue';
  actions?: React.ReactNode;
}

function CompactOrderCard({ order, variant, actions }: CompactOrderCardProps) {
  const timeAgo = getTimeAgo(new Date(order.created_at));

  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{order.id}</span>
            {variant === 'queue' && order.queue_number && (
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                #{order.queue_number}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 truncate">{order.customer_name}</p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-orange-600">{formatPrice(order.total_amount)}</p>
          <p className="text-xs text-gray-400">{timeAgo}</p>
        </div>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
      </div>
      {actions}
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

interface ConfirmModalProps {
  title: string;
  message: string;
  order: Order;
  confirmText: string;
  confirmStyle: 'success' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

function ConfirmModal({
  title,
  message,
  order,
  confirmText,
  confirmStyle,
  onConfirm,
  onCancel,
  isLoading,
}: ConfirmModalProps) {
  const createdAt = new Date(order.created_at);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className={`px-6 py-4 ${confirmStyle === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              confirmStyle === 'success' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {confirmStyle === 'success' ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500">{message}</p>
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="px-6 py-4 space-y-3">
          {/* Order ID and Customer */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500">Order ID</span>
              <p className="text-lg font-bold text-gray-900">{order.id}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500">ลูกค้า</span>
              <p className="font-medium text-gray-900">{order.customer_name}</p>
            </div>
          </div>

          {/* Items */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <span className="text-xs text-gray-500 font-medium">รายการสินค้า</span>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.name} x{item.quantity}
                </span>
                <span className="text-gray-900">{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-gray-200 flex justify-between">
              <span className="font-medium text-gray-900">รวมทั้งหมด</span>
              <span className="font-bold text-lg text-orange-600">{formatPrice(order.total_amount)}</span>
            </div>
          </div>

          {/* Time */}
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>สร้างเมื่อ {createdAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
              confirmStyle === 'success'
                ? 'bg-green-500 hover:bg-green-600'
                : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>กำลังดำเนินการ...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function StaffDashboard() {
  return (
    <StaffProvider>
      <StaffDashboardContent />
    </StaffProvider>
  );
}
