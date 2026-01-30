import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import type { CartItem } from "@/types/api";

// Maximum quantity per item
const MAX_QUANTITY_PER_ITEM = 30;

interface POSOrderItemProps {
  item: CartItem;
  onIncrement: (itemId: number) => void;
  onDecrement: (itemId: number) => void;
  onRemove: (itemId: number) => void;
}

export function POSOrderItem({ item, onIncrement, onDecrement, onRemove }: POSOrderItemProps) {
  const subtotal = item.price * item.quantity;
  const isAtMaxQuantity = item.quantity >= MAX_QUANTITY_PER_ITEM;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{item.name}</p>
        <p className="text-sm text-muted-foreground">
          ฿{item.price.toFixed(0)} × {item.quantity}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onDecrement(item.menu_item_id)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => onIncrement(item.menu_item_id)}
            disabled={isAtMaxQuantity}
            title={isAtMaxQuantity ? `Maximum ${MAX_QUANTITY_PER_ITEM} items` : undefined}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(item.menu_item_id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>

        <span className="w-16 text-right font-medium text-foreground">
          ฿{subtotal.toFixed(0)}
        </span>
      </div>
    </div>
  );
}
