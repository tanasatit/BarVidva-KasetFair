import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MenuItem } from "@/types/api";

interface MenuItemCardProps {
  item: MenuItem;
  quantity?: number;
  onAdd: (item: MenuItem) => void;
}

export function MenuItemCard({ item, quantity = 0, onAdd }: MenuItemCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98] relative"
      onClick={() => onAdd(item)}
    >
      {quantity > 0 && (
        <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0 text-xs">
          {quantity}
        </Badge>
      )}
      <CardContent className="p-4 text-center">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="w-full h-44 mx-auto mb-3 object-contain rounded-lg bg-white"
          />
        ) : (
          <div className="w-full h-44 mx-auto mb-3 bg-muted rounded-lg flex items-center justify-center text-3xl">
            🍟
          </div>
        )}
        <h3 className="font-medium text-foreground text-sm">{item.name}</h3>
        <p className="text-lg font-bold text-primary mt-1">
          ฿{item.price.toFixed(0)}
        </p>
      </CardContent>
    </Card>
  );
}
