import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, ArrowLeft } from "lucide-react";
import type { OrderItemData } from "@/types/order";

export default function ConfirmPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);

  useEffect(() => {
    const orderData = searchParams.get("order");
    if (orderData) {
      try {
        const parsed = JSON.parse(decodeURIComponent(orderData));
        setOrderItems(parsed);
      } catch {
        console.error("Failed to parse order data");
      }
    }
  }, [searchParams]);

  const total = orderItems.reduce(
    (sum, item) => sum + item.drink.price * item.quantity,
    0
  );

  const handleConfirm = () => {
    setIsConfirmed(true);
    // Auto-redirect after 3 seconds
    setTimeout(() => {
      navigate("/");
    }, 3000);
  };

  const handleBack = () => {
    navigate("/");
  };

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mb-6 animate-scale-in">
              <CheckCircle className="h-24 w-24 text-primary mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Order Confirmed!
            </h2>
            <p className="text-muted-foreground mb-6">
              Thank you for your order. Redirecting to POS...
            </p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to POS
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to POS
        </Button>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Scan to Confirm</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG
                  value="https://example.com/confirm"
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Scan this QR code or click the button below
              </p>
            </CardContent>
          </Card>

          {/* Order Recap */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {orderItems.length === 0 ? (
                <p className="text-muted-foreground">No items in order</p>
              ) : (
                <>
                  <div className="space-y-3">
                    {orderItems.map((item) => (
                      <div
                        key={item.drink.id}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.drink.emoji} {item.drink.name} × {item.quantity}
                        </span>
                        <span className="font-medium">
                          ${(item.drink.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Separator className="my-4" />
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Confirm Button */}
        <div className="mt-8 text-center">
          <Button
            size="lg"
            className="px-12"
            onClick={handleConfirm}
            disabled={orderItems.length === 0}
          >
            Confirm Order
          </Button>
        </div>
      </div>
    </div>
  );
}
