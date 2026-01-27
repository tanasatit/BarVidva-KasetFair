import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMenu } from "@/hooks/useMenu";
import { orderApi } from "@/services/api";
import { MenuItemCard } from "@/components/pos/MenuItemCard";
import { POSOrderSummary } from "@/components/pos/POSOrderSummary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { History, Loader2 } from "lucide-react";
import { getCurrentDateKey, cartToOrderItems } from "@/utils/orderUtils";
import type { MenuItem, CartItem, CreateOrderRequest } from "@/types/api";

// Category label mapping (English to Thai)
const categoryLabels: Record<string, string> = {
  food: "อาหาร",
  Food: "อาหาร",
  drink: "เครื่องดื่ม",
  Drink: "เครื่องดื่ม",
  drinks: "เครื่องดื่ม",
  Drinks: "เครื่องดื่ม",
  beverage: "เครื่องดื่ม",
  Beverage: "เครื่องดื่ม",
  snack: "ของว่าง",
  Snack: "ของว่าง",
  Other: "อื่นๆ",
  other: "อื่นๆ",
};

// Category sort order (lower = first)
const categorySortOrder: Record<string, number> = {
  food: 1,
  Food: 1,
  อาหาร: 1,
  drink: 2,
  Drink: 2,
  drinks: 2,
  Drinks: 2,
  beverage: 2,
  Beverage: 2,
  เครื่องดื่ม: 2,
  snack: 3,
  Snack: 3,
  ของว่าง: 3,
  Other: 99,
  other: 99,
  อื่นๆ: 99,
};

const getCategoryLabel = (category: string): string => {
  return categoryLabels[category] || category;
};

const getCategorySortOrder = (category: string): number => {
  return categorySortOrder[category] || 50;
};

export function POSPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: menuItems, isLoading, error } = useMenu();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");

  // Get unique categories from menu items, sorted by predefined order
  const categories = useMemo(() => {
    if (!menuItems) return [];
    const cats = new Set(menuItems.map((item) => item.category || "Other"));
    return Array.from(cats).sort(
      (a, b) => getCategorySortOrder(a) - getCategorySortOrder(b)
    );
  }, [menuItems]);

  // Group items by category
  const itemsByCategory = useMemo(() => {
    if (!menuItems) return {};
    return menuItems.reduce(
      (acc, item) => {
        const cat = item.category || "Other";
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(item);
        return acc;
      },
      {} as Record<string, MenuItem[]>
    );
  }, [menuItems]);

  // Get quantity for an item in cart
  const getQuantity = (itemId: number) => {
    const cartItem = cart.find((item) => item.menu_item_id === itemId);
    return cartItem?.quantity || 0;
  };

  // Add item to cart
  const handleAddItem = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menu_item_id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menu_item_id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1,
        },
      ];
    });
  };

  // Increment item quantity
  const handleIncrement = (itemId: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.menu_item_id === itemId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrement item quantity
  const handleDecrement = (itemId: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.menu_item_id === itemId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove item from cart
  const handleRemove = (itemId: number) => {
    setCart((prev) => prev.filter((item) => item.menu_item_id !== itemId));
  };

  // Clear cart
  const handleClear = () => {
    setCart([]);
    setCustomerName("");
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: (request: CreateOrderRequest) => orderApi.create(request),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      // Navigate to payment screen with order data
      navigate(`/payment/${order.id}`, { state: { order } });
    },
  });

  // Handle confirm/create order
  const handleConfirm = () => {
    const request: CreateOrderRequest = {
      customer_name: customerName.trim(),
      items: cartToOrderItems(cart),
      date_key: getCurrentDateKey(),
    };
    createOrderMutation.mutate(request);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading menu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="bg-destructive/10 border border-destructive rounded-lg p-6 max-w-md text-center">
          <p className="text-destructive font-medium">Failed to load menu</p>
          <p className="text-destructive/80 text-sm mt-2">{error.message}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Bar Vidva POS
          </h1>
          <Button
            variant="outline"
            onClick={() => navigate("/history")}
          >
            <History className="h-4 w-4 mr-2" />
            History
          </Button>
        </div>
      </header>

      {/* Error message */}
      {createOrderMutation.isError && (
        <div className="bg-destructive/10 border-b border-destructive px-6 py-3">
          <p className="text-destructive text-sm">
            Failed to create order: {createOrderMutation.error.message}
          </p>
        </div>
      )}

      {/* Main content - split panel */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel - Menu (70%) */}
        <div className="w-[70%] p-6 overflow-auto">
          {categories.length > 1 ? (
            <Tabs defaultValue={categories[0]}>
              <TabsList className="mb-6">
                {categories.map((cat) => (
                  <TabsTrigger key={cat} value={cat}>
                    {getCategoryLabel(cat)}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((cat) => (
                <TabsContent key={cat} value={cat}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {itemsByCategory[cat]?.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        quantity={getQuantity(item.id)}
                        onAdd={handleAddItem}
                      />
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          ) : (
            // No categories - show all items in grid
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {menuItems?.map((item) => (
                <MenuItemCard
                  key={item.id}
                  item={item}
                  quantity={getQuantity(item.id)}
                  onAdd={handleAddItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Panel - Order Summary (30%) */}
        <div className="w-[30%] border-l border-border bg-card p-4">
          <POSOrderSummary
            items={cart}
            customerName={customerName}
            onCustomerNameChange={setCustomerName}
            onIncrement={handleIncrement}
            onDecrement={handleDecrement}
            onRemove={handleRemove}
            onClear={handleClear}
            onConfirm={handleConfirm}
            isSubmitting={createOrderMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
}

export default POSPage;
