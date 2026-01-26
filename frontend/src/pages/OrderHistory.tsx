import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  ArrowLeft,
  CheckCircle,
  Loader2,
  RefreshCw,
  Clock,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import { orderApi, staffApi } from "@/services/api";
import type { OrderStatus } from "@/types/api";

// Get staff password from localStorage or env
const getStaffPassword = () =>
  localStorage.getItem("staff_password") ||
  import.meta.env.VITE_STAFF_PASSWORD ||
  "staff123";

export function OrderHistory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"all" | "paid" | "completed">(
    "all"
  );

  // Fetch orders using the queue endpoint (shows PAID orders) and completed
  const {
    data: queueOrders,
    isLoading: isLoadingQueue,
    refetch: refetchQueue,
  } = useQuery({
    queryKey: ["queue"],
    queryFn: orderApi.getQueue,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: completedOrders, isLoading: isLoadingCompleted } = useQuery({
    queryKey: ["orders", "completed"],
    queryFn: () => staffApi.getCompletedOrders(getStaffPassword()),
    refetchInterval: 10000,
  });

  const { data: pendingOrders, isLoading: isLoadingPending } = useQuery({
    queryKey: ["orders", "pending"],
    queryFn: () => staffApi.getPendingOrders(getStaffPassword()),
    refetchInterval: 10000,
  });

  // Combine all orders
  const allOrders = [
    ...(pendingOrders || []),
    ...(queueOrders || []),
    ...(completedOrders || []),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // Filter orders based on active tab
  const filteredOrders =
    activeTab === "all"
      ? allOrders
      : activeTab === "paid"
        ? queueOrders || []
        : completedOrders || [];

  // Mark order as complete mutation
  const completeOrderMutation = useMutation({
    mutationFn: (orderId: string) =>
      staffApi.completeOrder(getStaffPassword(), orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["queue"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  // Calculate stats
  const stats = {
    totalOrders: allOrders.length,
    paidOrders: (queueOrders || []).length,
    completedOrders: (completedOrders || []).length,
    totalRevenue: allOrders
      .filter((o) => o.status !== "CANCELLED" && o.status !== "PENDING_PAYMENT")
      .reduce((sum, o) => sum + o.total_amount, 0),
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
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
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
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">
                ฿{stats.totalRevenue.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as typeof activeTab)}
        >
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              All ({allOrders.length})
            </TabsTrigger>
            <TabsTrigger value="paid">
              Paid ({(queueOrders || []).length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({(completedOrders || []).length})
            </TabsTrigger>
          </TabsList>

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
                  <Table>
                    <TableHeader>
                      <TableRow>
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
                      {filteredOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-mono font-medium">
                            {order.id}
                          </TableCell>
                          <TableCell>{order.customer_name}</TableCell>
                          <TableCell className="max-w-[200px]">
                            <span className="text-sm text-muted-foreground truncate block">
                              {order.items
                                .map((i) => `${i.name} ×${i.quantity}`)
                                .join(", ")}
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
