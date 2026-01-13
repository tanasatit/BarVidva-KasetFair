import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CustomerOrder } from '@/pages/CustomerOrder';
import { StaffDashboard } from '@/pages/StaffDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { QueueTracker } from '@/pages/QueueTracker';

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
          <Route path="/" element={<CustomerOrder />} />
          <Route path="/order" element={<CustomerOrder />} />
          <Route path="/queue" element={<QueueTracker />} />
          <Route path="/queue/:orderId" element={<QueueTracker />} />
          <Route path="/staff" element={<StaffDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
