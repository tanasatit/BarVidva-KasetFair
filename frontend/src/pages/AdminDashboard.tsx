import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminProvider, useAdminAuth } from '@/context/AdminContext';
import { AdminLogin } from '@/components/AdminLogin';
import {
  useAdminMenu,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
  usePopularItems,
  useAdminStats,
  useOrdersByHour,
  useDailyBreakdown,
} from '@/hooks/useAdmin';
import {
  usePendingOrders,
  useQueueOrders,
  useCompletedOrders,
} from '@/hooks/useStaff';
import type { MenuItem, CreateMenuItemRequest, PopularItem, DateRange, DailyBreakdown } from '@/types/api';
import { formatPrice } from '@/utils/orderUtils';

// shadcn/ui components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  BookOpen,
  ClipboardList,
  LogOut,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  ShoppingBag,
  Clock,
  DollarSign,
  TrendingUp,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
} from 'lucide-react';

type TabType = 'overview' | 'menu' | 'orders';

const ADMIN_TAB_STORAGE_KEY = 'admin-dashboard-tab';

function AdminDashboardContent() {
  const { isAuthenticated, isLoading: authLoading, logout } = useAdminAuth();
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem(ADMIN_TAB_STORAGE_KEY);
    return (saved as TabType) || 'overview';
  });
  const navigate = useNavigate();

  // Persist tab state
  useEffect(() => {
    localStorage.setItem(ADMIN_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-sm text-muted-foreground">Bar Vidva - Kaset Fair</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigate('/')}>
                <ClipboardList className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">POS</span>
              </Button>
              <Button variant="ghost" onClick={logout}>
                <LogOut className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation using shadcn/ui Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
        <div className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4">
            <TabsList className="h-auto p-0 bg-transparent gap-1">
              <TabsTrigger
                value="overview"
                className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <BarChart3 className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="menu"
                className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <BookOpen className="h-4 w-4" />
                จัดการเมนู
              </TabsTrigger>
              <TabsTrigger
                value="orders"
                className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none"
              >
                <ClipboardList className="h-4 w-4" />
                ออเดอร์ทั้งหมด
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        {/* Tab Content */}
        <main className="max-w-7xl mx-auto px-4 py-6">
          <TabsContent value="overview" className="mt-0">
            <OverviewTab />
          </TabsContent>
          <TabsContent value="menu" className="mt-0">
            <MenuTab />
          </TabsContent>
          <TabsContent value="orders" className="mt-0">
            <OrdersTab />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}


// Event dates: Jan 30 - Feb 7, 2026
const EVENT_START = '2026-01-30';
const EVENT_END = '2026-02-07';

type DatePreset = 'today' | 'yesterday' | 'last7' | 'allEvent' | 'custom';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

function getLast7Days(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function formatDateThai(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

function OverviewTab() {
  const [preset, setPreset] = useState<DatePreset>('today');
  const [customStart, setCustomStart] = useState(getToday());
  const [customEnd, setCustomEnd] = useState(getToday());

  const dateRange: DateRange | undefined = useMemo(() => {
    switch (preset) {
      case 'today':
        return { start_date: getToday(), end_date: getToday() };
      case 'yesterday':
        return { start_date: getYesterday(), end_date: getYesterday() };
      case 'last7':
        const last7 = getLast7Days();
        return { start_date: last7.start, end_date: last7.end };
      case 'allEvent':
        return { start_date: EVENT_START, end_date: EVENT_END };
      case 'custom':
        return { start_date: customStart, end_date: customEnd };
    }
  }, [preset, customStart, customEnd]);

  const isMultiDay = dateRange && dateRange.start_date !== dateRange.end_date;

  // Fetch data with date range
  const { data: stats, isLoading: statsLoading } = useAdminStats(dateRange);
  const { data: ordersByHourData } = useOrdersByHour(dateRange);
  const { data: popularItems } = usePopularItems(dateRange);
  const { data: dailyBreakdown } = useDailyBreakdown(dateRange);

  // For recent activity, always use today's data
  const { data: pendingOrders } = usePendingOrders();
  const { data: queueOrders } = useQueueOrders();
  const { data: completedOrders } = useCompletedOrders();

  const totalOrders = stats?.total_orders || 0;
  const totalRevenue = stats?.total_revenue || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Transform orders by hour data
  const ordersByHour = useMemo(() => {
    const hours = Array.from({ length: 13 }, (_, i) => ({ hour: i + 9, count: 0 }));
    if (Array.isArray(ordersByHourData)) {
      ordersByHourData.forEach(item => {
        const hourData = hours.find(h => h.hour === item.hour);
        if (hourData) hourData.count = item.count;
      });
    }
    return hours;
  }, [ordersByHourData]);

  // Date range label
  const dateLabel = useMemo(() => {
    if (!dateRange) return 'วันนี้';
    if (dateRange.start_date === dateRange.end_date) {
      return preset === 'today' ? 'วันนี้' : formatDateThai(dateRange.start_date);
    }
    return `${formatDateThai(dateRange.start_date)} - ${formatDateThai(dateRange.end_date)}`;
  }, [dateRange, preset]);

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground font-medium">ช่วงเวลา:</span>
            <div className="flex flex-wrap gap-2">
              <PresetButton active={preset === 'today'} onClick={() => setPreset('today')}>วันนี้</PresetButton>
              <PresetButton active={preset === 'yesterday'} onClick={() => setPreset('yesterday')}>เมื่อวาน</PresetButton>
              <PresetButton active={preset === 'last7'} onClick={() => setPreset('last7')}>7 วันล่าสุด</PresetButton>
              <PresetButton active={preset === 'allEvent'} onClick={() => setPreset('allEvent')}>ทั้งงาน</PresetButton>
              <PresetButton active={preset === 'custom'} onClick={() => setPreset('custom')}>กำหนดเอง</PresetButton>
            </div>
            {preset === 'custom' && (
              <div className="flex items-center gap-2 ml-auto">
                <Input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-auto"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-auto"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={`ออเดอร์ ${preset === 'today' ? 'วันนี้' : ''}`}
          value={statsLoading ? '...' : totalOrders.toString()}
          subtitle={preset !== 'today' ? dateLabel : undefined}
          icon={<ShoppingBag className="h-6 w-6" />}
        />
        <StatCard
          title={`รายได้ ${preset === 'today' ? 'วันนี้' : ''}`}
          value={statsLoading ? '...' : formatPrice(totalRevenue)}
          subtitle={preset !== 'today' ? dateLabel : undefined}
          icon={<DollarSign className="h-6 w-6" />}
          highlight
        />
        <StatCard
          title="รอชำระเงิน"
          value={statsLoading ? '...' : (stats?.pending_orders || 0).toString()}
          icon={<Clock className="h-6 w-6" />}
        />
        <StatCard
          title="ในคิว"
          value={statsLoading ? '...' : (stats?.queue_length || 0).toString()}
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* Daily Breakdown Chart - Only show for multi-day ranges */}
      {isMultiDay && dailyBreakdown && dailyBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>เปรียบเทียบรายวัน</CardTitle>
          </CardHeader>
          <CardContent>
            <DailyBreakdownChart data={dailyBreakdown} />
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Orders by Hour Chart */}
        <Card>
          <CardHeader>
            <CardTitle>ออเดอร์ตามชั่วโมง</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChartComponent data={ordersByHour} />
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle>สรุปภาพรวม</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <QuickStatRow label="เสร็จสิ้นแล้ว" value={stats?.completed_orders || 0} total={totalOrders} color="green" />
            <QuickStatRow label="กำลังทำ" value={stats?.queue_length || 0} total={totalOrders} color="blue" />
            <QuickStatRow label="รอชำระ" value={stats?.pending_orders || 0} total={totalOrders} color="amber" />
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ยอดเฉลี่ยต่อออเดอร์</span>
                <span className="text-foreground font-medium">{formatPrice(avgOrderValue)}</span>
              </div>
              {stats?.avg_completion_time_mins !== undefined && stats.avg_completion_time_mins > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">เวลาเฉลี่ยในการทำ</span>
                  <span className="text-foreground font-medium">{Math.round(stats.avg_completion_time_mins)} นาที</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Items Section */}
      <Card>
        <CardHeader>
          <CardTitle>
            เมนูขายดี {preset !== 'today' && <span className="text-sm font-normal text-muted-foreground">({dateLabel})</span>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PopularItemsList items={popularItems || []} />
        </CardContent>
      </Card>

      {/* Recent Activity - Always shows today */}
      <Card>
        <CardHeader>
          <CardTitle>
            กิจกรรมล่าสุด <span className="text-sm font-normal text-muted-foreground">(วันนี้)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RecentActivity
            pending={pendingOrders || []}
            queue={queueOrders || []}
            completed={completedOrders || []}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function PresetButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <Button
      variant={active ? 'default' : 'outline'}
      size="sm"
      onClick={onClick}
      className={active ? '' : 'bg-muted'}
    >
      {children}
    </Button>
  );
}

function DailyBreakdownChart({ data }: { data: DailyBreakdown[] }) {
  const maxOrders = Math.max(...data.map(d => d.total_orders), 1);
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-500 rounded" />
          <span className="text-gray-600">ออเดอร์</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-600">รายได้</span>
        </div>
      </div>

      {/* Chart */}
      <div className="space-y-3">
        {data.map((day) => (
          <div key={day.date} className="flex items-center gap-4">
            <div className="w-20 flex-shrink-0 text-sm text-gray-600">
              {formatDateThai(day.date)}
            </div>
            <div className="flex-1 space-y-1">
              {/* Orders bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${(day.total_orders / maxOrders) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-xs text-gray-500 text-right">{day.total_orders}</span>
              </div>
              {/* Revenue bar */}
              <div className="flex items-center gap-2">
                <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(day.revenue / maxRevenue) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-xs text-gray-500 text-right">{formatPrice(day.revenue)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}

function StatCard({ title, value, subtitle, icon, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? 'bg-primary/5 border-primary/20' : ''}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-muted-foreground text-sm">{title}</span>
          <div className={highlight ? 'text-primary' : 'text-muted-foreground'}>{icon}</div>
        </div>
        <p className={`text-2xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
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

interface BarChartComponentProps {
  data: { hour: number; count: number }[];
}

function BarChartComponent({ data }: BarChartComponentProps) {
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
  const pendingArr = Array.isArray(pending) ? pending : [];
  const queueArr = Array.isArray(queue) ? queue : [];
  const completedArr = Array.isArray(completed) ? completed : [];

  const allOrders = [...pendingArr, ...queueArr, ...completedArr]
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
              {order?.created_at
                ? new Date(order.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                : '-'}
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
        <h2 className="text-xl font-semibold text-foreground">จัดการเมนูอาหาร</h2>
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="h-4 w-4 mr-2" />
          เพิ่มเมนูใหม่
        </Button>
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
              <AdminMenuItemCard
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

interface AdminMenuItemCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
  onToggleAvailable: () => void;
}

function AdminMenuItemCard({ item, onEdit, onDelete, onToggleAvailable }: AdminMenuItemCardProps) {
  return (
    <Card className={!item.available ? 'border-destructive/50' : ''}>
      {/* Image Section */}
      <div className="aspect-video bg-muted flex items-center justify-center overflow-hidden rounded-t-lg">
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-foreground font-medium">{item.name}</h3>
            {item.category && (
              <span className="text-xs text-muted-foreground">{item.category}</span>
            )}
          </div>
          <span className="text-lg font-bold text-primary">{formatPrice(item.price)}</span>
        </div>

        <div className="flex items-center justify-between">
          <Badge
            variant={item.available ? 'default' : 'destructive'}
            className="cursor-pointer"
            onClick={onToggleAvailable}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${item.available ? 'bg-green-300' : 'bg-red-300'}`} />
            {item.available ? 'พร้อมขาย' : 'หมด'}
          </Badge>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || '');
  const [available, setAvailable] = useState(initialData?.available ?? true);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit file size to 500KB for database storage
    if (file.size > 500 * 1024) {
      alert('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 500KB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) return;
    await onSubmit({
      name: name.trim(),
      price: parseFloat(price),
      category: category.trim() || undefined,
      image_url: imageUrl || undefined,
      available,
    });
  };

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>รูปภาพเมนู</Label>
            <div className="flex items-start gap-4">
              {/* Image Preview */}
              <div className="w-24 h-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted flex-shrink-0">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              {/* Upload Controls */}
              <div className="flex-1 space-y-2">
                <Label className="inline-flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors cursor-pointer">
                  <Upload className="h-4 w-4" />
                  อัปโหลดรูป
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </Label>
                {imageUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    ลบรูป
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">รองรับ JPG, PNG ขนาดไม่เกิน 500KB</p>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="menu-name">ชื่อเมนู</Label>
              <Input
                id="menu-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น เฟรนช์ฟรายส์ M"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="menu-price">ราคา (บาท)</Label>
              <Input
                id="menu-price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="เช่น 35"
                min="0"
                step="1"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="menu-category">หมวดหมู่ (ไม่บังคับ)</Label>
              <Input
                id="menu-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="เช่น เฟรนช์ฟรายส์"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={available}
                  onChange={(e) => setAvailable(e.target.checked)}
                  className="w-5 h-5 rounded border-border text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-foreground">พร้อมขาย</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={onCancel}>
              ยกเลิก
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim() || !price}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                initialData ? 'บันทึก' : 'เพิ่มเมนู'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

type SortOption = 'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'status';
type StatusFilter = 'all' | 'PENDING_PAYMENT' | 'PAID' | 'COMPLETED' | 'CANCELLED';

const ITEMS_PER_PAGE = 10;

function OrdersTab() {
  const { data: pendingOrders } = usePendingOrders();
  const { data: queueOrders } = useQueueOrders();
  const { data: completedOrders } = useCompletedOrders();

  // Search, filter, sort, and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date_desc');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Combine all orders (ensure arrays)
  const allOrders = useMemo(() => {
    const pending = Array.isArray(pendingOrders) ? pendingOrders : [];
    const queue = Array.isArray(queueOrders) ? queueOrders : [];
    const completed = Array.isArray(completedOrders) ? completedOrders : [];
    return [...pending, ...queue, ...completed];
  }, [pendingOrders, queueOrders, completedOrders]);

  // Get unique customers for filter dropdown
  // const uniqueCustomers = useMemo(() => {
  //   const customers = new Set(allOrders.map(order => order.customer_name));
  //   return Array.from(customers).sort();
  // }, [allOrders]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let result = [...allOrders];

    // Search filter (order ID or customer name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(order =>
        String(order.id).toLowerCase().includes(query) ||
        (order.customer_name ?? '').toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(order => order.status === statusFilter);
    }

    // Customer filter
    if (customerFilter !== 'all') {
      result = result.filter(order => order.customer_name === customerFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc': {
          const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
          const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
          return tb - ta;
        }
        case 'date_asc': {
          const ta = a?.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b?.created_at ? new Date(b.created_at).getTime() : 0;
          return ta - tb;
        }
        case 'amount_desc':
          return b.total_amount - a.total_amount;
        case 'amount_asc':
          return a.total_amount - b.total_amount;
        case 'status':
          const statusOrder = { PENDING_PAYMENT: 0, PAID: 1, COMPLETED: 2, CANCELLED: 3 };
          return (statusOrder[a.status as keyof typeof statusOrder] || 4) -
                 (statusOrder[b.status as keyof typeof statusOrder] || 4);
        default:
          return 0;
      }
    });

    return result;
  }, [allOrders, searchQuery, statusFilter, customerFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // const handleCustomerFilterChange = (value: string) => {
  //   setCustomerFilter(value);
  //   setCurrentPage(1);
  // };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCustomerFilter('all');
    setSortBy('date_desc');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || customerFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">ออเดอร์ทั้งหมดวันนี้</h2>
        <span className="text-muted-foreground">{filteredOrders.length} / {allOrders.length} รายการ</span>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="ค้นหา Order ID หรือชื่อลูกค้า..."
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSearchChange('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">เรียงตาม:</Label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="px-3 py-1.5 text-sm border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
              >
                <option value="date_desc">ล่าสุด</option>
                <option value="date_asc">เก่าสุด</option>
                <option value="amount_desc">ยอดมาก → น้อย</option>
                <option value="amount_asc">ยอดน้อย → มาก</option>
                <option value="status">สถานะ</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Label className="text-muted-foreground">สถานะ:</Label>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as StatusFilter)}
                className="px-3 py-1.5 text-sm border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
              >
                <option value="all">ทั้งหมด</option>
                <option value="PENDING_PAYMENT">รอชำระ</option>
                <option value="PAID">กำลังทำ</option>
                <option value="COMPLETED">เสร็จสิ้น</option>
                <option value="CANCELLED">ยกเลิก</option>
              </select>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-primary"
              >
                <X className="h-4 w-4 mr-1" />
                ล้างตัวกรอง
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      {allOrders.length === 0 ? (
        <div className="text-center py-12">
          <ClipboardList className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">ยังไม่มีออเดอร์วันนี้</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">ไม่พบออเดอร์ที่ตรงกับการค้นหา</p>
            <Button variant="link" onClick={clearFilters} className="mt-3">
              ล้างตัวกรอง
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>ลูกค้า</TableHead>
                    <TableHead>รายการ</TableHead>
                    <TableHead className="text-right">ยอดรวม</TableHead>
                    <TableHead className="text-center">สถานะ</TableHead>
                    <TableHead className="text-right">เวลา</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell className="text-muted-foreground">{order.customer_name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm max-w-[200px]">
                        <span className="truncate block">
                          {(order.items || []).map(i => `${i.name} x${i.quantity}`).join(', ') || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-primary font-medium">
                        {formatPrice(order.total_amount)}
                      </TableCell>
                      <TableCell className="text-center">
                        <OrderStatusBadge status={order.status} />
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {order?.created_at
                          ? new Date(order.created_at).toLocaleTimeString('th-TH', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                แสดง {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)} จาก {filteredOrders.length} รายการ
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="หน้าแรก"
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  title="หน้าก่อน"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1 mx-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(page => {
                      return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                    })
                    .map((page, index, array) => (
                      <span key={page} className="flex items-center">
                        {index > 0 && array[index - 1] !== page - 1 && (
                          <span className="px-1 text-muted-foreground">...</span>
                        )}
                        <Button
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="min-w-[32px]"
                        >
                          {page}
                        </Button>
                      </span>
                    ))}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  title="หน้าถัดไป"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  title="หน้าสุดท้าย"
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function OrderStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    PENDING_PAYMENT: { label: 'รอชำระ', variant: 'outline' },
    PAID: { label: 'กำลังทำ', variant: 'default' },
    COMPLETED: { label: 'เสร็จสิ้น', variant: 'secondary' },
    CANCELLED: { label: 'ยกเลิก', variant: 'destructive' },
  };

  const { label, variant } = config[status] || { label: status, variant: 'outline' as const };

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-3" />
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    </div>
  );
}

export function AdminDashboard() {
  return (
    <AdminProvider>
      <AdminDashboardContent />
    </AdminProvider>
  );
}
