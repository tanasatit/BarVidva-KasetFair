import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Trash } from "lucide-react";
import { OrderItem } from "./OrderItem";
import type { OrderItemData } from "@/types/order";

interface OrderSummaryProps {
  items: OrderItemData[];
  onIncrement: (drinkId: string) => void;
  onDecrement: (drinkId: string) => void;
  onRemove: (drinkId: string) => void;
  onClear: () => void;
  onConfirm: () => void;
}

export function OrderSummary({
  items,
  onIncrement,
  onDecrement,
  onRemove,
  onClear,
  onConfirm,
}: OrderSummaryProps) {
  const total = items.reduce(
    (sum, item) => sum + item.drink.price * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Order Summary
          {itemCount > 0 && (
            <span className="ml-auto text-sm font-normal text-muted-foreground">
              {itemCount} item{itemCount !== 1 ? "s" : ""}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <p>No items in order</p>
          </div>
        ) : (
          <div>
            {items.map((item) => (
              <OrderItem
                key={item.drink.id}
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
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </>
      )}
      
      <CardFooter className="flex gap-2 pt-0">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onClear}
          disabled={items.length === 0}
        >
          <Trash className="h-4 w-4 mr-2" />
          Clear
        </Button>
        <Button
          className="flex-1"
          onClick={onConfirm}
          disabled={items.length === 0}
        >
          Confirm Order
        </Button>
      </CardFooter>
    </Card>
  );
}
