import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminProvider, useAdminAuth } from '@/context/AdminContext';
import { StaffProvider } from '@/context/StaffContext';
import { AdminLogin } from '@/components/AdminLogin';
import {
  useAdminMenu,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  usePopularItems,
} from '@/hooks/useAdmin';
import {
  usePendingOrders,
  useQueueOrders,
  useCompletedOrders,
} from '@/hooks/useStaff';
import type { MenuItem, CreateMenuItemRequest, PopularItem } from '@/types/api';
import { formatPrice } from '@/utils/orderUtils';

type TabType = 'overview' | 'menu' | 'orders';

function AdminDashboardContent() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const navigate = useNavigate();

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
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-500">Bar Vidva - Kaset Fair</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/staff')}
                className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="hidden sm:inline">Staff Dashboard</span>
              </button>
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            <TabButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              label="Overview"
            />
            <TabButton
              active={activeTab === 'menu'}
              onClick={() => setActiveTab('menu')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>}
              label="จัดการเมนู"
            />
            <TabButton
              active={activeTab === 'orders'}
              onClick={() => setActiveTab('orders')}
              icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
              label="ออเดอร์ทั้งหมด"
            />
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'menu' && <MenuTab />}
        {activeTab === 'orders' && <OrdersTab />}
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

function OverviewTab() {
  const { data: pendingOrders } = usePendingOrders();
  const { data: queueOrders } = useQueueOrders();
  const { data: completedOrders } = useCompletedOrders();
  const { data: popularItems } = usePopularItems();

  // Calculate stats from real data
  const totalOrders = (pendingOrders?.length || 0) + (queueOrders?.length || 0) + (completedOrders?.length || 0);
  const totalRevenue = [...(pendingOrders || []), ...(queueOrders || []), ...(completedOrders || [])]
    .reduce((sum, order) => sum + order.total_amount, 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Orders by hour
  const ordersByHour = getOrdersByHour([...(pendingOrders || []), ...(queueOrders || []), ...(completedOrders || [])]);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="ออเดอร์วันนี้"
          value={totalOrders.toString()}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        />
        <StatCard
          title="รายได้วันนี้"
          value={formatPrice(totalRevenue)}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          highlight
        />
        <StatCard
          title="รอชำระเงิน"
          value={(pendingOrders?.length || 0).toString()}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <StatCard
          title="ในคิว"
          value={(queueOrders?.length || 0).toString()}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
        />
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders by Hour Chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">ออเดอร์ตามชั่วโมง</h3>
          <BarChart data={ordersByHour} />
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">สรุปภาพรวม</h3>
          <div className="space-y-4">
            <QuickStatRow label="เสร็จสิ้นแล้ว" value={completedOrders?.length || 0} total={totalOrders} color="green" />
            <QuickStatRow label="กำลังทำ" value={queueOrders?.length || 0} total={totalOrders} color="blue" />
            <QuickStatRow label="รอชำระ" value={pendingOrders?.length || 0} total={totalOrders} color="amber" />
            <div className="pt-4 border-t border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">ยอดเฉลี่ยต่อออเดอร์</span>
                <span className="text-gray-900 font-medium">{formatPrice(avgOrderValue)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Popular Items Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">เมนูขายดี</h3>
        <PopularItemsList items={popularItems || []} />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">กิจกรรมล่าสุด</h3>
        <RecentActivity
          pending={pendingOrders || []}
          queue={queueOrders || []}
          completed={completedOrders || []}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function StatCard({ title, value, icon, highlight }: StatCardProps) {
  return (
    <div className={`rounded-xl border p-5 ${highlight ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-gray-500 text-sm">{title}</span>
        <div className={highlight ? 'text-orange-500' : 'text-gray-400'}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold ${highlight ? 'text-orange-600' : 'text-gray-900'}`}>{value}</p>
    </div>
  );
}

interface QuickStatRowProps {
  label: string;
  value: number;
  total: number;
  color: 'green' | 'blue' | 'amber';
}

function QuickStatRow({ label, value, total, color }: QuickStatRowProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
  };

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-500">{label}</span>
        <span className="text-gray-900">{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

interface BarChartProps {
  data: { hour: number; count: number }[];
}

function BarChart({ data }: BarChartProps) {
  const maxCount = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="flex items-end justify-between h-48 gap-1">
      {data.map((item) => (
        <div key={item.hour} className="flex flex-col items-center flex-1">
          <div className="w-full flex flex-col items-center justify-end h-40">
            <span className="text-xs text-gray-400 mb-1">{item.count || ''}</span>
            <div
              className="w-full max-w-8 bg-orange-500 rounded-t transition-all duration-500"
              style={{ height: `${(item.count / maxCount) * 100}%`, minHeight: item.count > 0 ? '4px' : '0' }}
            />
          </div>
          <span className="text-xs text-gray-500 mt-2">{item.hour}:00</span>
        </div>
      ))}
    </div>
  );
}

interface PopularItemsListProps {
  items: PopularItem[];
}

function PopularItemsList({ items }: PopularItemsListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-gray-500">ยังไม่มีข้อมูลเมนูขายดี</p>
      </div>
    );
  }

  const maxQuantity = Math.max(...items.map(i => i.quantity_sold), 1);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const percentage = (item.quantity_sold / maxQuantity) * 100;
        return (
          <div key={item.menu_item_id} className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm">
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-gray-900 truncate">{item.name}</span>
                <span className="text-gray-500 text-sm ml-2">{item.quantity_sold} ชิ้น</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
            <div className="flex-shrink-0 text-right">
              <span className="font-medium text-orange-600">{formatPrice(item.revenue)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecentActivity({ pending, queue, completed }: { pending: any[]; queue: any[]; completed: any[] }) {
  const allOrders = [...pending, ...queue, ...completed]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  if (allOrders.length === 0) {
    return <p className="text-gray-500 text-center py-8">ยังไม่มีออเดอร์วันนี้</p>;
  }

  return (
    <div className="space-y-3">
      {allOrders.map((order) => (
        <div
          key={order.id}
          className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              order.status === 'COMPLETED' ? 'bg-green-500' :
              order.status === 'PAID' ? 'bg-blue-500' : 'bg-amber-500'
            }`} />
            <div>
              <p className="text-gray-900 font-medium">{order.id}</p>
              <p className="text-sm text-gray-500">{order.customer_name}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-900 font-medium">{formatPrice(order.total_amount)}</p>
            <p className="text-xs text-gray-400">
              {new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function MenuTab() {
  const { data: menuItems, isLoading } = useAdminMenu();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">จัดการเมนูอาหาร</h2>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          เพิ่มเมนูใหม่
        </button>
      </div>

      {/* Add New Form */}
      {isAddingNew && (
        <MenuItemForm
          onSubmit={async (data) => {
            await createMenuItem.mutateAsync(data);
            setIsAddingNew(false);
          }}
          onCancel={() => setIsAddingNew(false)}
          isLoading={createMenuItem.isPending}
        />
      )}

      {/* Menu Items Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems?.map((item) => (
          <div key={item.id}>
            {editingId === item.id ? (
              <MenuItemForm
                initialData={item}
                onSubmit={async (data) => {
                  await updateMenuItem.mutateAsync({ id: item.id, item: data });
                  setEditingId(null);
                }}
                onCancel={() => setEditingId(null)}
                isLoading={updateMenuItem.isPending}
              />
            ) : (
              <MenuItemCard
                item={item}
                onEdit={() => setEditingId(item.id)}
                onDelete={() => deleteMenuItem.mutate(item.id)}
                onToggleAvailable={() => updateMenuItem.mutate({
                  id: item.id,
                  item: { available: !item.available }
                })}
              />
            )}
          </div>
        ))}
      </div>

      {(!menuItems || menuItems.length === 0) && !isAddingNew && (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <p className="text-gray-500">ยังไม่มีเมนูอาหาร</p>
          <p className="text-gray-400 text-sm mt-1">คลิก "เพิ่มเมนูใหม่" เพื่อเริ่มต้น</p>
        </div>
      )}
    </div>
  );
}

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailable: () => void;
}

function MenuItemCard({ item, onEdit, onDelete, onToggleAvailable }: MenuItemCardProps) {
  return (
    <div className={`bg-white rounded-xl border ${item.available ? 'border-gray-200' : 'border-red-200'} overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-gray-900 font-medium">{item.name}</h3>
            {item.category && (
              <span className="text-xs text-gray-500">{item.category}</span>
            )}
          </div>
          <span className="text-lg font-bold text-orange-600">{formatPrice(item.price)}</span>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={onToggleAvailable}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              item.available
                ? 'bg-green-50 text-green-600 hover:bg-green-100'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${item.available ? 'bg-green-500' : 'bg-red-500'}`} />
            {item.available ? 'พร้อมขาย' : 'หมด'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MenuItemFormProps {
  initialData?: MenuItem;
  onSubmit: (data: CreateMenuItemRequest) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

function MenuItemForm({ initialData, onSubmit, onCancel, isLoading }: MenuItemFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price?.toString() || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [available, setAvailable] = useState(initialData?.available ?? true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    await onSubmit({
      name: name.trim(),
      price: parseFloat(price),
      category: category.trim() || undefined,
      available,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-orange-200 p-4 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">ชื่อเมนู</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="เช่น เฟรนช์ฟรายส์ M"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">ราคา (บาท)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="เช่น 35"
            min="0"
            step="1"
            required
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">หมวดหมู่ (ไม่บังคับ)</label>
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            placeholder="เช่น เฟรนช์ฟรายส์"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={available}
              onChange={(e) => setAvailable(e.target.checked)}
              className="w-5 h-5 rounded bg-gray-50 border-gray-300 text-orange-500 focus:ring-orange-500 focus:ring-offset-0"
            />
            <span className="text-gray-900">พร้อมขาย</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          ยกเลิก
        </button>
        <button
          type="submit"
          disabled={isLoading || !name.trim() || !price}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'กำลังบันทึก...' : initialData ? 'บันทึก' : 'เพิ่มเมนู'}
        </button>
      </div>
    </form>
  );
}

function OrdersTab() {
  const { data: pendingOrders } = usePendingOrders();
  const { data: queueOrders } = useQueueOrders();
  const { data: completedOrders } = useCompletedOrders();

  const allOrders = [...(pendingOrders || []), ...(queueOrders || []), ...(completedOrders || [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">ออเดอร์ทั้งหมดวันนี้</h2>
        <span className="text-gray-500">{allOrders.length} รายการ</span>
      </div>

      {allOrders.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-gray-500">ยังไม่มีออเดอร์วันนี้</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">Order ID</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">ลูกค้า</th>
                  <th className="text-left text-sm font-medium text-gray-500 px-4 py-3">รายการ</th>
                  <th className="text-right text-sm font-medium text-gray-500 px-4 py-3">ยอดรวม</th>
                  <th className="text-center text-sm font-medium text-gray-500 px-4 py-3">สถานะ</th>
                  <th className="text-right text-sm font-medium text-gray-500 px-4 py-3">เวลา</th>
                </tr>
              </thead>
              <tbody>
                {allOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{order.id}</td>
                    <td className="px-4 py-3 text-gray-600">{order.customer_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-sm">
                      {order.items.map(i => `${i.name} x${i.quantity}`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-right text-orange-600 font-medium">
                      {formatPrice(order.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-right text-gray-400 text-sm">
                      {new Date(order.created_at).toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    PENDING_PAYMENT: { label: 'รอชำระ', class: 'bg-amber-100 text-amber-700' },
    PAID: { label: 'กำลังทำ', class: 'bg-blue-100 text-blue-700' },
    COMPLETED: { label: 'เสร็จสิ้น', class: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'ยกเลิก', class: 'bg-red-100 text-red-700' },
  }[status] || { label: status, class: 'bg-gray-100 text-gray-700' };

  return (
    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
      {config.label}
    </span>
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

function getOrdersByHour(orders: any[]): { hour: number; count: number }[] {
  // Generate hours 9-21 (typical operating hours)
  const hours = Array.from({ length: 13 }, (_, i) => ({ hour: i + 9, count: 0 }));

  orders.forEach(order => {
    const hour = new Date(order.created_at).getHours();
    const hourData = hours.find(h => h.hour === hour);
    if (hourData) hourData.count++;
  });

  return hours;
}

export function AdminDashboard() {
  return (
    <AdminProvider>
      <StaffProvider>
        <AdminDashboardContent />
      </StaffProvider>
    </AdminProvider>
  );
}
