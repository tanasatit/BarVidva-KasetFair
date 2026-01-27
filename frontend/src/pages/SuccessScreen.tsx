import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Plus, Loader2, XCircle } from "lucide-react";
import { orderApi } from "@/services/api";
import type { Order } from "@/types/api";

export function SuccessScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Get order from navigation state or fetch from API
  const orderFromState = location.state?.order as Order | undefined;

  const { data: orderFromApi, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orderApi.getById(orderId!),
    enabled: !orderFromState && !!orderId,
  });

  const order = orderFromState || orderFromApi;

  // Handle new order
  const handleNewOrder = () => {
    navigate("/");
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading order...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Order Not Found</h2>
            <p className="text-muted-foreground mb-4">
              {error?.message || "Unable to load order details"}
            </p>
            <Button onClick={() => navigate("/")}>Return to POS</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Payment Confirmed!</CardTitle>
          <p className="text-muted-foreground">Order has been marked as paid</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Order ID */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Order ID</p>
            <p className="text-3xl font-bold text-primary">{order.id}</p>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge
              variant={order.status === "PAID" ? "default" : "secondary"}
              className="bg-green-100 text-green-800 border-green-200"
            >
              {order.status}
            </Badge>
          </div>

          <Separator />

          {/* Order Items */}
          <div className="space-y-2">
            <p className="font-medium text-sm text-muted-foreground">
              Order Items
            </p>
            {order.items.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium">
                  ฿{(item.price * item.quantity).toFixed(0)}
                </span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Total */}
          <div className="flex justify-between text-lg font-bold">
            <span>Total Paid</span>
            <span className="text-primary">฿{order.total_amount.toFixed(0)}</span>
          </div>

          {/* Queue Number (if assigned) */}
          {order.queue_number && (
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Queue Number</p>
              <p className="text-4xl font-bold text-primary">
                {order.queue_number}
              </p>
            </div>
          )}

          {/* New Order Button */}
          <Button className="w-full" size="lg" onClick={handleNewOrder}>
            <Plus className="h-5 w-5 mr-2" />
            New Order
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default SuccessScreen;
