import { useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import type { Order } from '@/types/api';
import { formatPrice } from '@/utils/orderUtils';
import { generatePromptPayPayload, formatAccountForDisplay } from '@/utils/promptpay';

interface PaymentInfoProps {
  order: Order;
}

// Get PromptPay number from environment variable
const PROMPTPAY_NUMBER = import.meta.env.VITE_PROMPTPAY_NUMBER || '';

export function PaymentInfo({ order }: PaymentInfoProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate PromptPay payload with amount
  const promptPayPayload = PROMPTPAY_NUMBER
    ? generatePromptPayPayload(PROMPTPAY_NUMBER, order.total_amount)
    : '';

  // Download QR code as image
  const handleDownloadQR = useCallback(() => {
    if (!qrRef.current) return;

    const svg = qrRef.current.querySelector('svg');
    if (!svg) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size (with padding)
    const size = 300;
    const padding = 20;
    canvas.width = size + padding * 2;
    canvas.height = size + padding * 2;

    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Convert SVG to image
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding, size, size);
      URL.revokeObjectURL(url);

      // Download
      const link = document.createElement('a');
      link.download = `promptpay-${order.id}-${order.total_amount}THB.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = url;
  }, [order.id, order.total_amount]);

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

      {/* PromptPay QR Code Section */}
      {PROMPTPAY_NUMBER && promptPayPayload ? (
        <div className="bg-white rounded-xl p-6 shadow-lg border-2 border-orange-200">
          <h3 className="font-bold text-lg text-gray-900 mb-4">สแกนเพื่อชำระเงิน</h3>

          {/* QR Code */}
          <div
            ref={qrRef}
            className="bg-white p-4 rounded-lg inline-block"
          >
            <QRCodeSVG
              value={promptPayPayload}
              size={200}
              level="M"
              includeMargin={false}
            />
          </div>

          {/* Amount */}
          <div className="mt-4 bg-orange-50 rounded-lg p-4">
            <p className="text-center text-3xl font-bold text-orange-600">
              {formatPrice(order.total_amount)}
            </p>
            <p className="text-center text-gray-500 text-sm mt-1">ยอดที่ต้องชำระ (รวมใน QR แล้ว)</p>
          </div>

          {/* PromptPay account display */}
          <p className="text-sm text-gray-500 mt-3">
            พร้อมเพย์: {formatAccountForDisplay(PROMPTPAY_NUMBER)}
          </p>

          {/* Download button */}
          <button
            type="button"
            onClick={handleDownloadQR}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            บันทึก QR Code
          </button>
        </div>
      ) : (
        /* Fallback: Manual payment instructions */
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
      )}

      {/* Payment instructions */}
      <div className="bg-blue-50 rounded-lg p-4 text-left">
        <h4 className="font-semibold text-blue-800 mb-2">ขั้นตอนหลังชำระเงิน</h4>
        <ol className="space-y-2 text-sm text-blue-700">
          <li className="flex gap-2">
            <span className="font-bold">1.</span>
            <span>แสดงสลิปการโอนให้พนักงานที่บูธ</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">2.</span>
            <span>รอพนักงานยืนยันการชำระเงิน</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold">3.</span>
            <span>รับหมายเลขคิวและรอเรียกรับอาหาร</span>
          </li>
        </ol>
      </div>

      <div className="text-sm text-gray-500">
        <p>กรุณาชำระเงินภายใน 1 ชั่วโมง</p>
        <p>มิฉะนั้นออเดอร์จะถูกยกเลิกอัตโนมัติ</p>
      </div>

      <Link
        to={`/queue/${order.id}`}
        className="block w-full px-4 py-3 bg-orange-500 text-white font-medium rounded-lg text-center hover:bg-orange-600 active:bg-orange-700 transition-colors"
      >
        ติดตามสถานะออเดอร์
      </Link>
    </div>
  );
}
