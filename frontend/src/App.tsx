import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { POSPage } from '@/pages/POSPage';
import { PaymentScreen } from '@/pages/PaymentScreen';
import { OrderHistory } from '@/pages/OrderHistory';
import { AdminDashboard } from '@/pages/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Main POS page */}
          <Route path="/" element={<POSPage />} />
          <Route path="/pos" element={<POSPage />} />

          {/* Payment flow */}
          <Route path="/payment/:orderId" element={<PaymentScreen />} />

          {/* Order history */}
          <Route path="/history" element={<OrderHistory />} />

          {/* Admin dashboard */}
          <Route path="/admin" element={<AdminDashboard />} />

          {/* Redirects for old routes */}
          <Route path="/order" element={<Navigate to="/" replace />} />
          <Route path="/staff" element={<Navigate to="/history" replace />} />
          <Route path="/queue" element={<Navigate to="/history" replace />} />
          <Route path="/queue/:orderId" element={<Navigate to="/history" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
