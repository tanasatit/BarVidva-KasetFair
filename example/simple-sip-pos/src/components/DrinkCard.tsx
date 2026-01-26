import { Card, CardContent } from "@/components/ui/card";
import type { Drink } from "@/data/drinks";

interface DrinkCardProps {
  drink: Drink;
  onAdd: (drink: Drink) => void;
}

export function DrinkCard({ drink, onAdd }: DrinkCardProps) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
      onClick={() => onAdd(drink)}
    >
      <CardContent className="p-4 text-center">
        <div className="text-3xl mb-2">{drink.emoji}</div>
        <h3 className="font-medium text-foreground">{drink.name}</h3>
        <p className="text-lg font-bold text-primary mt-1">
          ${drink.price.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
}
