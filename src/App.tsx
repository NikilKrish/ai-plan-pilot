import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import AppLayout from "@/components/layout/AppLayout";
import UploadPage from "./pages/UploadPage";
import Index from "./pages/Index";
import PlannerPage from "./pages/PlannerPage";
import BottlenecksPage from "./pages/BottlenecksPage";
import SimulationsPage from "./pages/SimulationsPage";
import ReportsPage from "./pages/ReportsPage";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "@/components/layout/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<UploadPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Index />} />
                <Route path="/planner" element={<PlannerPage />} />
                <Route path="/bottlenecks" element={<BottlenecksPage />} />
                <Route path="/simulations" element={<SimulationsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
