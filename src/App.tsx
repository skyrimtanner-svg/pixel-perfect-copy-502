import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ModeProvider } from "@/contexts/ModeContext";
import AppLayout from "@/components/AppLayout";
import TriagePage from "@/pages/TriagePage";
import TracesPage from "@/pages/TracesPage";
import CalibrationPage from "@/pages/CalibrationPage";
import NotFound from "./pages/NotFound";
import VerifyPage from "./pages/VerifyPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ModeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<TriagePage />} />
              <Route path="/traces" element={<TracesPage />} />
              <Route path="/calibration" element={<CalibrationPage />} />
            </Route>
            <Route path="/verify/:hash" element={<VerifyPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ModeProvider>
  </QueryClientProvider>
);

export default App;
