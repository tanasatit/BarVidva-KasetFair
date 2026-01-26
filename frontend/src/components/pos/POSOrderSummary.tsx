import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash, Loader2 } from "lucide-react";
import { POSOrderItem } from "./POSOrderItem";
import type { CartItem } from "@/types/api";

interface POSOrderSummaryProps {
  items: CartItem[];
  customerName: string;
  onCustomerNameChange: (name: string) => void;
  onIncrement: (itemId: number) => void;
  onDecrement: (itemId: number) => void;
  onRemove: (itemId: number) => void;
  onClear: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
}

export function POSOrderSummary({
  items,
  customerName,
  onCustomerNameChange,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onConfirm,
  isSubmitting = false,
}: POSOrderSummaryProps) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const isValid = customerName.trim().length >= 2 && items.length > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="h-5 w-5" />
          Order Summary
          {itemCount > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-auto space-y-4">
        {/* Customer Name Input */}
        <div className="space-y-2">
          <Label htmlFor="customer-name">Customer Name</Label>
          <Input
            id="customer-name"
            placeholder="Enter customer name"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="w-full"
          />
          {customerName.length > 0 && customerName.length < 2 && (
            <p className="text-xs text-destructive">
              Name must be at least 2 characters
            </p>
          )}
        </div>

        <Separator />

        {/* Order Items */}
        {items.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-muted-foreground">
            <p>No items in order</p>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <POSOrderItem
                key={item.menu_item_id}
                item={item}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </CardContent>

      {items.length > 0 && (
        <>
          <Separator />
          <div className="p-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-primary">฿{total.toFixed(0)}</span>
            </div>
          </div>
        </>
      )}

      <CardFooter className="flex gap-2 pt-0">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onClear}
          disabled={items.length === 0 || isSubmitting}
        >
          <Trash className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button
          className="flex-1"
          onClick={onConfirm}
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            "Create Order"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
