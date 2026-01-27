# POS System Redesign - Task Tracker

## Completed

### Phase 1: Setup shadcn/ui Components
- [x] Installed dependencies: class-variance-authority, clsx, tailwind-merge, lucide-react, @radix-ui/*
- [x] Created `/src/lib/utils.ts` with `cn()` helper
- [x] Added shadcn/ui components: Button, Card, Tabs, Input, Label, Separator, Table, Badge
- [x] Updated `index.css` with shadcn design system variables

### Phase 2: Create POS Components
- [x] Created `MenuItemCard` - Grid-style menu item cards
- [x] Created `POSOrderItem` - Cart line item with quantity controls
- [x] Created `POSOrderSummary` - Order summary panel with customer name input

### Phase 3: Create New Pages
- [x] Created `POSPage` - Split-panel POS interface (70% menu / 30% order summary)
- [x] Created `PaymentScreen` - Shows PromptPay QR and "Mark as Paid" button
- [x] Created `SuccessScreen` - Confirmation screen with order details
- [x] Created `OrderHistory` - Table view of today's orders with stats

### Phase 4: Update Routing
- [x] Updated `App.tsx` with new routes
- [x] Added redirects for old routes (/order, /staff, /queue)

### Phase 5: Backend Changes
- [x] Using existing `/api/v1/staff/orders/:id/verify` endpoint

### Phase 6: Create Hooks
- [x] Simplified `useStaff.ts` to not require StaffContext

### Phase 7: Remove Deprecated Code
- [x] Removed CustomerOrder.tsx, QueueTracker.tsx, PaymentPage.tsx, StaffDashboard.tsx
- [x] Removed StaffLogin.tsx, StaffContext.tsx
- [x] Removed useOffline.ts, offline.ts
- [x] Updated AdminDashboard.tsx to remove StaffProvider

### Phase 8: Bug Fixes
- [x] Removed Customer Name display from SuccessScreen and PaymentScreen
- [x] Added public POS API endpoints (no auth required):
  - `GET /api/v1/pos/orders/pending`
  - `GET /api/v1/pos/orders/completed`
  - `PUT /api/v1/pos/orders/:id/mark-paid`
  - `PUT /api/v1/pos/orders/:id/complete`
- [x] Updated frontend to use new posApi (PaymentScreen, OrderHistory, useStaff hook)
- [x] Category tabs now use Thai labels (อาหาร, เครื่องดื่ม, ของว่าง, อื่นๆ)
- [x] Categories sorted by predefined order (food, drinks, snacks, other)
- [x] Fixed DELETE /admin/menu/:id - now returns 409 Conflict with helpful message when menu item is used in orders

### Phase 9: Admin Dashboard Enhancement
- [x] Replaced header with shadcn/ui Button components
- [x] Replaced tab navigation with shadcn/ui Tabs component
- [x] Updated StatCard to use shadcn/ui Card component
- [x] Updated date range picker to use Card and Input components
- [x] Updated chart sections to use Card components
- [x] Updated PresetButton to use Button component
- [x] Updated MenuTab with Button and Plus icon
- [x] Renamed MenuItemCard to AdminMenuItemCard with Card, Badge, Button
- [x] Updated MenuItemForm with Card, Input, Label, Button, lucide icons
- [x] Updated OrdersTab with shadcn/ui Table components
- [x] Updated OrderStatusBadge to use Badge component
- [x] Updated pagination with Button and lucide icons
- [x] Updated LoadingState to use Loader2 icon

---

## All Tasks Completed

The POS System Redesign is now complete with all phases implemented:
- shadcn/ui component library integrated
- New POS workflow with split-panel layout
- Payment and success screens
- Order history page
- Public POS API endpoints (no auth required)
- Admin Dashboard enhanced with shadcn/ui design system
