import { useState } from 'react';
import { validateCustomerName } from '@/utils/orderUtils';

interface NameInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
}

export function NameInput({ value, onChange, error }: NameInputProps) {
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
  };

  const validationError = touched ? validateCustomerName(value) : null;
  const displayError = error || validationError;

  return (
    <div className="space-y-2">
      <label
        htmlFor="customerName"
        className="block text-lg font-semibold text-gray-800"
      >
        ชื่อผู้สั่ง
      </label>
      <input
        id="customerName"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        placeholder="กรอกชื่อของคุณ"
        maxLength={50}
        className={`w-full px-4 py-3 rounded-lg border-2 text-lg transition-colors outline-none ${
          displayError
            ? 'border-red-500 focus:border-red-500'
            : 'border-gray-200 focus:border-orange-500'
        }`}
        aria-describedby={displayError ? 'name-error' : undefined}
      />
      {displayError && (
        <p id="name-error" className="text-red-500 text-sm">
          {displayError}
        </p>
      )}
      <p className="text-gray-500 text-sm">
        เราจะเรียกชื่อนี้เมื่อออเดอร์พร้อม
      </p>
    </div>
  );
}
