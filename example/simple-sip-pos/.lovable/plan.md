

# Simple POS Sample Website

A clean, frontend-only Point of Sale demo with a drink menu and QR confirmation flow.

---

## Page 1: POS Page (Staff Use)

**Split-View Layout:**
- **Left Panel (70%)**: Drink menu displayed as a grid of clickable cards
- **Right Panel (30%)**: Order summary with selected items, quantities, and total

**Menu Categories:**
- ☕ Coffee (Espresso, Latte, Cappuccino, Americano)
- 🍵 Tea (Green Tea, Iced Tea, Chai Latte)
- 🥤 Other (Smoothies, Lemonade, Soda)

**Functionality:**
- Click a drink card to add it to the order
- Show quantity controls (+/-) in the order summary
- Display running total
- "Clear Order" button to reset
- "Confirm Order" button navigates to the QR page

---

## Page 2: QR & Confirmation Page

**Display:**
- Large QR code (links to a static placeholder URL like `https://example.com/confirm`)
- Order summary recap
- "Confirm Order" button (simulates customer action)

**After Confirmation:**
- Show a success message with a checkmark animation
- "Back to POS" button to return to the main page (or auto-redirect after 3 seconds)

---

## Technical Approach

- **Routing**: React Router with 2 routes (`/` and `/confirm`)
- **State**: React `useState` for order items (passed via URL params or context)
- **QR Code**: Use `qrcode.react` library for generating the QR
- **Components**: shadcn/ui Button, Card, Badge, Separator
- **Data**: Hardcoded array of ~10-12 sample beverages with name, price, and category

---

## Component Structure

```
src/
├── pages/
│   ├── POSPage.tsx        # Main POS interface
│   └── ConfirmPage.tsx    # QR code & confirmation
├── components/
│   ├── DrinkCard.tsx      # Individual drink button/card
│   ├── OrderSummary.tsx   # Right-side order panel
│   └── OrderItem.tsx      # Single item in order list
├── data/
│   └── drinks.ts          # Sample menu data
└── App.tsx                # Router setup
```

---

## UI Style

- Clean white/gray background
- Large, touch-friendly buttons (good for POS-style interaction)
- Clear typography with prices prominently displayed
- Desktop-first with responsive considerations
- Minimal animations for a professional feel

