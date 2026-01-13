import type { CartItem } from '@/types/api';
import { formatPrice, calculateTotal } from '@/utils/orderUtils';

interface OrderSummaryProps {
  items: CartItem[];
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled: boolean;
}

export function OrderSummary({
  items,
  onSubmit,
  isSubmitting,
  disabled,
}: OrderSummaryProps) {
  const total = calculateTotal(items);
  const hasItems = items.length > 0;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">สรุปรายการ</h2>

      {hasItems ? (
        <div className="bg-white rounded-lg border-2 border-gray-200 divide-y">
          {items.map((item) => (
            <div
              key={item.menu_item_id}
              className="flex justify-between items-center p-3"
            >
              <div>
                <span className="font-medium">{item.name}</span>
                <span className="text-gray-500 ml-2">x{item.quantity}</span>
              </div>
              <span className="font-semibold">
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}

          <div className="flex justify-between items-center p-4 bg-orange-50">
            <span className="text-lg font-bold">รวม</span>
            <span className="text-xl font-bold text-orange-600">
              {formatPrice(total)}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500 bg-gray-100 rounded-lg">
          ยังไม่ได้เลือกรายการ
        </div>
      )}

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || isSubmitting || !hasItems}
        className="w-full py-4 px-6 rounded-lg bg-orange-500 text-white text-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-600 active:bg-orange-700 transition-colors"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            กำลังดำเนินการ...
          </span>
        ) : (
          `ยืนยันสั่งซื้อ - ${formatPrice(total)}`
        )}
      </button>
    </div>
  );
}
