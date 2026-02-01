import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  RefreshCw,
  Clock,
  DollarSign,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Settings,
  Filter,
  CheckSquare,
} from "lucide-react";
import { orderApi, posApi, menuApi } from "@/services/api";
import type { OrderStatus } from "@/types/api";

const ITEMS_PER_PAGE = 10;

export function OrderHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"all" | "paid" | "completed">(
    "all"
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isBulkCompleting, setIsBulkCompleting] = useState(false);

  // Fetch categories for filter dropdown
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: menuApi.getCategories,
  });

  // Get category parameter for API calls
  const categoryParam = selectedCategory === "all" ? undefined : selectedCategory;

  // Fetch orders using the queue endpoint (shows PAID orders) and completed
  const {
    data: queueOrders,
    isLoading: isLoadingQueue,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ["queue", selectedCategory],
    queryFn: () => orderApi.getQueue(categoryParam),
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: completedOrders, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ["orders", "completed", selectedCategory],
    queryFn: () => posApi.getCompletedOrders(categoryParam),
    refetchInterval: 10000,
  });

  const { data: pendingOrders, isLoading: isLoadingPending } = useQuery({
    queryKey: ["orders", "pending", selectedCategory],
    queryFn: () => posApi.getPendingOrders(categoryParam),
    refetchInterval: 10000,
  });

  // Check if date is today
  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  };

  // Combine all orders (ensure arrays) and filter to TODAY only
  const pendingArr = Array.isArray(pendingOrders) ? pendingOrders : [];
  const queueArr = Array.isArray(queueOrders) ? queueOrders : [];
  const completedArr = Array.isArray(completedOrders) ? completedOrders : [];

  // Filter to today only
  const todayPending = pendingArr.filter((o) => isToday(o.created_at));
  const todayQueue = queueArr.filter((o) => isToday(o.created_at));
  const todayCompleted = completedArr.filter((o) => isToday(o.created_at));

  const allOrders = [
    ...todayPending,
    ...todayQueue,
    ...todayCompleted,
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Filter orders based on active tab (already filtered to today)
  const filteredOrders =
    activeTab === "all"
      ? allOrders
      : activeTab === "paid"
        ? todayQueue
        : todayCompleted;

  // Mark order as complete mutation
  const completeOrderMutation = useMutation({
    mutationFn: (orderId: string) => posApi.completeOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // Mark order as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: (orderId: string) => posApi.markPaid(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // Bulk complete orders
  const handleBulkComplete = async () => {
    if (selectedOrderIds.size === 0) return;

    setIsBulkCompleting(true);
    try {
      // Complete all selected orders in parallel
      await Promise.all(
        Array.from(selectedOrderIds).map((orderId) =>
          posApi.completeOrder(orderId)
        )
      );
      // Clear selection and refresh data
      setSelectedOrderIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    } catch (error) {
      console.error("Failed to complete orders:", error);
    } finally {
      setIsBulkCompleting(false);
    }
  };

  // Pagination calculations
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);

  // Toggle single order selection
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  // Toggle select all (only for PAID orders on current page)
  const paginatedSelectableOrders = paginatedOrders.filter((o) => o.status === "PAID");
  const allSelectableSelected = paginatedSelectableOrders.length > 0 &&
    paginatedSelectableOrders.every((o) => selectedOrderIds.has(o.id));

  const toggleSelectAll = () => {
    if (allSelectableSelected) {
      // Deselect all on current page
      setSelectedOrderIds((prev) => {
        const newSet = new Set(prev);
        paginatedSelectableOrders.forEach((o) => newSet.delete(o.id));
        return newSet;
      });
    } else {
      // Select all PAID orders on current page
      setSelectedOrderIds((prev) => {
        const newSet = new Set(prev);
        paginatedSelectableOrders.forEach((o) => newSet.add(o.id));
        return newSet;
      });
    }
  };

  // Reset to page 1 and clear selections when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value as typeof activeTab);
    setCurrentPage(1);
    setSelectedOrderIds(new Set());
  };

  // Reset to page 1 and clear selections when changing category
  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setCurrentPage(1);
    setSelectedOrderIds(new Set());
  };

  // Calculate stats (already filtered to today)
  const stats = {
    totalOrders: allOrders.length,
    paidOrders: todayQueue.length,
    completedOrders: todayCompleted.length,
    totalRevenue: allOrders
      .filter(
        (o) =>
          o.status !== "CANCELLED" &&
          o.status !== "PENDING_PAYMENT"
      )
      .reduce((sum, o) => sum + (o.total_amount || 0), 0),
  };

  const isLoading = isLoadingQueue || isLoadingCompleted || isLoadingPending;

  // Get status badge styling
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Pending
          </Badge>
        );
      case "PAID":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Paid
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completed
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Format time
  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold text-foreground">Order History</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refetchQueue();
                queryClient.invalidateQueries({ queryKey: ["orders"] });
              }}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/admin")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Admin
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShoppingBag className="h-4 w-4" />
                Total Orders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active (Paid)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600">
                {stats.paidOrders}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {stats.completedOrders}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Revenue (Today)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                ฿{stats.totalRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter */}
        {categories && categories.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-muted-foreground">Shop/Category:</Label>
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-transparent bg-background"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="ml-2">
                    Filtered: {selectedCategory}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
        >
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="all">
                All ({allOrders.length})
              </TabsTrigger>
              <TabsTrigger value="paid">
                Paid ({todayQueue.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({todayCompleted.length})
              </TabsTrigger>
            </TabsList>

            {/* Bulk Complete Button */}
            {selectedOrderIds.size > 0 && (
              <Button
                onClick={handleBulkComplete}
                disabled={isBulkCompleting}
                className="bg-green-600 hover:bg-green-700"
              >
                {isBulkCompleting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckSquare className="h-4 w-4 mr-2" />
                )}
                Complete Selected ({selectedOrderIds.size})
              </Button>
            )}
          </div>

          {/* Today Only Notice */}
          <div className="mb-4 text-sm text-muted-foreground">
            Showing orders from today only. Data resets at midnight.
          </div>

          <TabsContent value={activeTab}>
            <Card>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    No orders found
                  </div>
                ) : (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">
                            {paginatedSelectableOrders.length > 0 && (
                              <Checkbox
                                checked={allSelectableSelected}
                                onCheckedChange={toggleSelectAll}
                                aria-label="Select all"
                              />
                            )}
                          </TableHead>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              {order.status === "PAID" && (
                                <Checkbox
                                  checked={selectedOrderIds.has(order.id)}
                                  onCheckedChange={() => toggleOrderSelection(order.id)}
                                  aria-label={`Select order ${order.id}`}
                                />
                              )}
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              {order.id}
                            </TableCell>
                            <TableCell>{order.customer_name || "-"}</TableCell>
                            <TableCell className="max-w-[200px]">
                              <span className="text-sm text-muted-foreground truncate block">
                                {(order.items || [])
                                  .map((i) => `${i.name} ×${i.quantity}`)
                                  .join(", ") || "-"}
                              </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ฿{order.total_amount.toFixed(0)}
                            </TableCell>
                            <TableCell>{getStatusBadge(order.status)}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatTime(order.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              {order.status === "PENDING_PAYMENT" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    markPaidMutation.mutate(order.id)
                                  }
                                  disabled={markPaidMutation.isPending}
                                >
                                  {markPaidMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CreditCard className="h-4 w-4 mr-1" />
                                      Mark Paid
                                    </>
                                  )}
                                </Button>
                              )}
                              {order.status === "PAID" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    completeOrderMutation.mutate(order.id)
                                  }
                                  disabled={completeOrderMutation.isPending}
                                >
                                  {completeOrderMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-1" />
                                      Complete
                                    </>
                                  )}
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between px-4 py-3 border-t">
                        <div className="text-sm text-muted-foreground">
                          Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                          </Button>
                          <span className="text-sm text-muted-foreground px-2">
                            Page {currentPage} of {totalPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default OrderHistory;
