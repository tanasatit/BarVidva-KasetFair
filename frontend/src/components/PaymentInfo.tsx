import type { Order } from '@/types/api';
import { formatPrice } from '@/utils/orderUtils';

interface PaymentInfoProps {
  order: Order;
}

export function PaymentInfo({ order }: PaymentInfoProps) {
  return (
    <div className="text-center space-y-6">
      <div className="bg-green-100 text-green-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">สั่งซื้อสำเร็จ!</h2>
        <p className="text-gray-600 mt-1">หมายเลขออเดอร์ของคุณคือ</p>
        <p className="text-4xl font-bold text-orange-600 mt-2">{order.id}</p>
      </div>

      <div className="bg-orange-50 rounded-lg p-6 text-left space-y-4">
        <h3 className="font-bold text-lg text-gray-900">วิธีการชำระเงิน</h3>

        <div className="bg-white rounded-lg p-4 border-2 border-orange-200">
          <p className="text-center text-3xl font-bold text-orange-600">
            {formatPrice(order.total_amount)}
          </p>
          <p className="text-center text-gray-500 text-sm mt-1">ยอดที่ต้องชำระ</p>
        </div>

        <ol className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </span>
            <span>
              สแกน <strong>QR Code พร้อมเพย์</strong> ที่บูธ
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </span>
            <span>
              กรอกยอดเงิน: <strong>{formatPrice(order.total_amount)}</strong>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </span>
            <span>
              <strong>แสดงสลิปการโอน</strong> ให้พนักงาน
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
              4
            </span>
            <span>รอเรียกคิวรับอาหาร</span>
          </li>
        </ol>
      </div>

      <div className="text-sm text-gray-500">
        <p>กรุณาชำระเงินภายใน 10 นาที</p>
        <p>มิฉะนั้นออเดอร์จะถูกยกเลิกอัตโนมัติ</p>
      </div>
    </div>
  );
}
