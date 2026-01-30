import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
// import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Loader2, XCircle, Banknote, Smartphone } from "lucide-react";
import { orderApi, posApi } from "@/services/api";
// import { generatePromptPayPayload } from "@/utils/promptpay";
import type { Order, PaymentMethod } from "@/types/api";

// Default PromptPay number (10-digit phone number)
// const PROMPTPAY_NUMBER = import.meta.env.VITE_PROMPTPAY_NUMBER || "0812345678";

export function PaymentScreen() {
  const { orderId } = useParams<{ orderId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("PROMPTPAY");

  // Get order from navigation state or fetch from API
  const orderFromState = location.state?.order as Order | undefined;

  const { data: orderFromApi, isLoading, error } = useQuery({
    queryKey: ["order", orderId],
    queryFn: () => orderApi.getById(orderId!),
    enabled: !orderFromState && !!orderId,
  });

  const order = orderFromState || orderFromApi;

  // Generate QR payload for PromptPay (10-digit phone number)
  // const qrPayload = order
  //   ? generatePromptPayPayload(PROMPTPAY_NUMBER, order.total_amount)
  //   : "";

  // Mark as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: () => posApi.markPaid(orderId!, paymentMethod),
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
                {(order.items || []).map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.name} x {item.quantity}
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

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4">
              <Button
                variant={paymentMethod === "PROMPTPAY" ? "default" : "outline"}
                className="flex-1 h-16"
                onClick={() => setPaymentMethod("PROMPTPAY")}
              >
                <Smartphone className="h-5 w-5 mr-2" />
                PromptPay
              </Button>
              <Button
                variant={paymentMethod === "CASH" ? "default" : "outline"}
                className="flex-1 h-16"
                onClick={() => setPaymentMethod("CASH")}
              >
                <Banknote className="h-5 w-5 mr-2" />
                Cash
              </Button>
            </CardContent>
          </Card>

          {/* Payment Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">
                {paymentMethod === "PROMPTPAY" ? "PromptPay QR Code" : "Cash Payment"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              {paymentMethod === "PROMPTPAY" ? (
                <>
                  <div className="bg-white p-4 rounded-lg mb-4">
                    {/* <QRCodeSVG value={qrPayload} size={200} level="M" /> */}
                  </div>
                  <p className="text-center text-muted-foreground text-sm mb-2">
                    Scan with mobile banking app
                  </p>
                </>
              ) : (
                <div className="py-8 text-center">
                  <Banknote className="h-16 w-16 text-primary mx-auto mb-4" />
                  <p className="text-muted-foreground mb-2">
                    Receive cash from customer
                  </p>
                </div>
              )}
              <p className="text-center font-bold text-2xl text-primary">
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
