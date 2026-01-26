import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { drinks, categories, type Drink } from "@/data/drinks";
import { DrinkCard } from "@/components/DrinkCard";
import { OrderSummary } from "@/components/OrderSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrderItemData } from "@/types/order";

export default function POSPage() {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState<OrderItemData[]>([]);

  const handleAddDrink = (drink: Drink) => {
    setOrderItems((prev) => {
      const existing = prev.find((item) => item.drink.id === drink.id);
      if (existing) {
        return prev.map((item) =>
          item.drink.id === drink.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { drink, quantity: 1 }];
    });
  };

  const handleIncrement = (drinkId: string) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.drink.id === drinkId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecrement = (drinkId: string) => {
    setOrderItems((prev) =>
      prev
        .map((item) =>
          item.drink.id === drinkId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemove = (drinkId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.drink.id !== drinkId));
  };

  const handleClear = () => {
    setOrderItems([]);
  };

  const handleConfirm = () => {
    // Pass order data via URL params (simple approach for demo)
    const orderData = encodeURIComponent(JSON.stringify(orderItems));
    navigate(`/confirm?order=${orderData}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">☕ Beverage POS</h1>
      </header>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Menu (70%) */}
        <div className="w-[70%] p-6 overflow-auto">
          <Tabs defaultValue="coffee">
            <TabsList className="mb-6">
              {categories.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat.id} value={cat.id}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {drinks
                    .filter((drink) => drink.category === cat.id)
                    .map((drink) => (
                      <DrinkCard
                        key={drink.id}
                        drink={drink}
                        onAdd={handleAddDrink}
                      />
                    ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Right Panel - Order Summary (30%) */}
        <div className="w-[30%] border-l border-border bg-card p-4">
          <OrderSummary
            items={orderItems}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemove={handleRemove}
            onClear={handleClear}
            onConfirm={handleConfirm}
          />
        </div>
      </div>
    </div>
  );
}
