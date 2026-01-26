import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { OrderItemData } from "@/types/order";

interface OrderItemProps {
  item: OrderItemData;
  onIncrement: (drinkId: string) => void;
  onDecrement: (drinkId: string) => void;
  onRemove: (drinkId: string) => void;
}

export function OrderItem({ item, onIncrement, onDecrement, onRemove }: OrderItemProps) {
  const { drink, quantity } = item;
  const subtotal = drink.price * quantity;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="font-medium text-foreground">{drink.name}</p>
        <p className="text-sm text-muted-foreground">
          ${drink.price.toFixed(2)} × {quantity}
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDecrement(drink.id)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-medium">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onIncrement(drink.id)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(drink.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        
        <span className="w-16 text-right font-medium text-foreground">
          ${subtotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
