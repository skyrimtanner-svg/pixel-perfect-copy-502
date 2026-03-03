import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ModeProvider } from "@/contexts/ModeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import TriagePage from "@/pages/TriagePage";
import TracesPage from "@/pages/TracesPage";
import CalibrationPage from "@/pages/CalibrationPage";
import AdminAnalyticsPage from "@/pages/AdminAnalyticsPage";
import AuthPage from "@/pages/AuthPage";
import NotFound from "./pages/NotFound";
import VerifyPage from "./pages/VerifyPage";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center nebula-bg">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'hsl(43, 96%, 56%)' }} />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<TriagePage />} />
        <Route path="/traces" element={<TracesPage />} />
        <Route path="/calibration" element={<CalibrationPage />} />
        <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
      </Route>
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ModeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/verify/:hash" element={<VerifyPage />} />
              <Route path="*" element={<ProtectedRoutes />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ModeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
