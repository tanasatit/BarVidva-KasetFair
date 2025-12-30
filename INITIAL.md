## FEATURE:
Build the MVP order creation flow for Bar vidva ordering system.

Customer can:
- Scan QR code at booth → land on order page
- View menu (French Fries: Small ฿40, Medium ฿60, Large ฿80)
- Select items (with quantity selector)
- Enter their name (2-50 characters, Thai/English)
- Click "Confirm Order"
- Receive Order ID in DXXX format (e.g., "1001" for Day 1, Order 1)
- See payment instructions with total amount

Backend needs:
- Go + Fiber API endpoint: POST /api/v1/orders
- PostgreSQL database with orders table
- Order ID generation logic (DXXX format)
- Validation: customer name, items exist, quantities valid
- Return 201 with order object

Frontend needs:
- TypeScript + React page at /order
- MenuSelector component (displays items, quantity controls)
- OrderSummary component (shows selected items, total)
- Form validation
- Offline-capable (save to IndexedDB if network fails)
- Auto-retry if submission fails

## EXAMPLES:
See examples/order_handler.go for Go handler pattern
See examples/menu_component.tsx for React component pattern

## DOCUMENTATION:
- Fiber docs: https://docs.gofiber.io/
- TanStack Query: https://tanstack.com/query/latest
- PostgreSQL + Go: https://github.com/jmoiron/sqlx

## OTHER CONSIDERATIONS:
- Must work offline (use Service Worker + IndexedDB)
- Order ID must be generated client-side for offline support
- Handle slow network gracefully (show loading states)
- Mobile-first responsive design