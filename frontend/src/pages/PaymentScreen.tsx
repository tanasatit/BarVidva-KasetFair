import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Loader2, XCircle } from "lucide-react";
import { orderApi, posApi } from "@/services/api";
import { generatePromptPayPayload } from "@/utils/promptpay";
import type { Order } from "@/types/api";

// Default PromptPay number (can be set via environment variable)
const PROMPTPAY_NUMBER = import.meta.env.VITE_PROMPTPAY_NUMBER || "0812345678";

export function PaymentScreen() {
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

  // Generate QR payload
  const qrPayload = order
    ? generatePromptPayPayload(PROMPTPAY_NUMBER, order.total_amount)
    : "";

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: () => posApi.markPaid(orderId!),
    onSuccess: () => {
      navigate("/");
    },
  });

  // Cancel and go back
  const handleCancel = () => {
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleCancel}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Payment</h1>
        </div>
      </header>

      {/* Main content */}
      <div className="container max-w-2xl mx-auto p-6">
        <div className="grid gap-6">
          {/* Order Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Order #{order.id}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
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
              <Separator className="my-4" />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  ฿{order.total_amount.toFixed(0)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* QR Code Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">PromptPay QR Code</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG value={qrPayload} size={200} level="M" />
              </div>
              <p className="text-center text-muted-foreground text-sm mb-2">
                Scan with mobile banking app
              </p>
              <p className="text-center font-bold text-xl text-primary">
                ฿{order.total_amount.toFixed(0)}
              </p>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={markPaidMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => markPaidMutation.mutate()}
              disabled={markPaidMutation.isPending}
            >
              {markPaidMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Paid
                </>
              )}
            </Button>
          </div>

          {/* Error message */}
          {markPaidMutation.isError && (
            <div className="bg-destructive/10 border border-destructive rounded-lg p-4 text-center">
              <p className="text-destructive text-sm">
                Failed to mark as paid: {markPaidMutation.error.message}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PaymentScreen;
