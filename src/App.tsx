import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ModeProvider } from "@/contexts/ModeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Lazy load pages
const AppLayout = lazy(() => import("@/components/AppLayout"));
const TriagePage = lazy(() => import("@/pages/TriagePage"));
const TracesPage = lazy(() => import("@/pages/TracesPage"));
const CalibrationPage = lazy(() => import("@/pages/CalibrationPage"));
const AdminAnalyticsPage = lazy(() => import("@/pages/AdminAnalyticsPage"));
const GuidePage = lazy(() => import("@/pages/GuidePage"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const VerifyPage = lazy(() => import("@/pages/VerifyPage"));
const LandingPage = lazy(() => import("@/pages/LandingPage"));
const InstallPage = lazy(() => import("@/pages/InstallPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center nebula-bg">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'hsl(43, 96%, 56%)' }} />
        <span className="text-xs font-mono text-muted-foreground tracking-widest uppercase animate-pulse">Initializing...</span>
      </div>
    </div>
  );
}

function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) return <Navigate to="/auth" replace />;

  return <Outlet />;
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ModeProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<LoadingScreen />}>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/verify/:hash" element={<VerifyPage />} />

                  <Route element={<ProtectedRoute />}>
                    <Route element={<AppLayout />}>
                      <Route path="/triage" element={<TriagePage />} />
                      <Route path="/traces" element={<TracesPage />} />
                      <Route path="/calibration" element={<CalibrationPage />} />
                      <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
                      <Route path="/guide" element={<GuidePage />} />
                      <Route path="*" element={<NotFound />} />
                    </Route>
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </ModeProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
