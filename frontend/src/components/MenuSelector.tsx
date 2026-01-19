import { useState } from 'react';
import type { MenuItem, CartItem } from '@/types/api';
import { formatPrice } from '@/utils/orderUtils';

interface MenuSelectorProps {
  items: MenuItem[];
  cart: CartItem[];
  onUpdateCart: (cart: CartItem[]) => void;
  showUnavailable?: boolean;
}

function MenuItemImage({ imageUrl, name }: { imageUrl?: string; name: string }) {
  const [hasError, setHasError] = useState(false);

  // Use image_url from API if available, otherwise use placeholder
  const imageSrc = hasError || !imageUrl ? '/images/menu/placeholder.svg' : imageUrl;

  return (
    <img
      src={imageSrc}
      alt={name}
      className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
      onError={() => setHasError(true)}
    />
  );
}

export function MenuSelector({ items, cart, onUpdateCart, showUnavailable = false }: MenuSelectorProps) {
  const getQuantity = (itemId: number): number => {
    const cartItem = cart.find((item) => item.menu_item_id === itemId);
    return cartItem?.quantity || 0;
  };

  const updateQuantity = (menuItem: MenuItem, delta: number) => {
    // Don't allow updates for unavailable items
    if (!menuItem.available) return;

    const currentQty = getQuantity(menuItem.id);
    const newQty = Math.max(0, Math.min(10, currentQty + delta));

    if (newQty === 0) {
      // Remove from cart
      onUpdateCart(cart.filter((item) => item.menu_item_id !== menuItem.id));
    } else {
      const existingIndex = cart.findIndex(
        (item) => item.menu_item_id === menuItem.id
      );

      if (existingIndex >= 0) {
        // Update quantity
        const newCart = [...cart];
        newCart[existingIndex] = { ...newCart[existingIndex], quantity: newQty };
        onUpdateCart(newCart);
      } else {
        // Add to cart
        onUpdateCart([
          ...cart,
          {
            menu_item_id: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: newQty,
          },
        ]);
      }
    }
  };

  // Separate available and unavailable items
  const availableItems = items.filter(item => item.available);
  const unavailableItems = items.filter(item => !item.available);

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">เลือกเมนู</h2>
      <div className="space-y-2">
        {/* Available items */}
        {availableItems.map((item) => {
          const quantity = getQuantity(item.id);
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                quantity > 0
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <MenuItemImage imageUrl={item.image_url} name={item.name} />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900">{item.name}</h3>
                <p className="text-orange-600 font-semibold">
                  {formatPrice(item.price)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateQuantity(item, -1)}
                  disabled={quantity === 0}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-gray-200 text-gray-700 font-bold text-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-300 active:bg-gray-400 transition-colors"
                  aria-label={`Decrease ${item.name} quantity`}
                >
                  −
                </button>

                <span className="w-8 text-center font-semibold text-lg">
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() => updateQuantity(item, 1)}
                  disabled={quantity >= 10}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-orange-500 text-white font-bold text-xl disabled:opacity-40 disabled:cursor-not-allowed hover:bg-orange-600 active:bg-orange-700 transition-colors"
                  aria-label={`Increase ${item.name} quantity`}
                >
                  +
                </button>
              </div>
            </div>
          );
        })}

        {/* Unavailable items (out of stock) */}
        {showUnavailable && unavailableItems.length > 0 && (
          <>
            {unavailableItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 rounded-xl border-2 border-gray-200 bg-gray-100 opacity-60"
              >
                <div className="relative">
                  <MenuItemImage imageUrl={item.image_url} name={item.name} />
                  <div className="absolute inset-0 bg-gray-500/30 rounded-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-500">{item.name}</h3>
                  <p className="text-gray-400 font-semibold">
                    {formatPrice(item.price)}
                  </p>
                </div>

                <div className="px-3 py-1.5 bg-gray-300 text-gray-600 text-sm font-medium rounded-full">
                  หมด
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
