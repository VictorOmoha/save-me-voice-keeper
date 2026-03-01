
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { VoiceFormProvider } from "./contexts/VoiceFormContext";
import { VoiceCommandProvider } from "./contexts/VoiceCommandContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeBootstrapper } from "./components/ThemeBootstrapper";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import AllEntries from "./pages/AllEntries";
import CategoryPage from "./pages/CategoryPage";
import Subscription from "./pages/Subscription";
import Settings from "./pages/Settings";
import UserGuide from "./pages/UserGuide";
import NotFound from "./pages/NotFound";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import { VoiceNavigationListener } from "./components/voice/VoiceNavigationListener";
import { VoiceCommandGlobalListener } from "./components/VoiceCommandGlobalListener";
import { NovaFloat } from "./components/NovaFloat";
import BrainDump from "./pages/BrainDump";
import Insights from "./pages/Insights";
import Onboarding from "./pages/Onboarding";
 
const queryClient = new QueryClient();
 
const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="ui-theme">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <ErrorBoundary>
            <AuthProvider>
              <ThemeBootstrapper />
              <VoiceCommandProvider><VoiceFormProvider>
                <HashRouter>
                  <VoiceNavigationListener />
                  <VoiceCommandGlobalListener />
                  <NovaFloat />
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/all-entries" element={<AllEntries />} />
                    <Route path="/all-entries/:entryId" element={<AllEntries />} />
                    <Route path="/category/:categoryName" element={<CategoryPage />} />
                    <Route path="/insights" element={<Insights />} />
                    <Route path="/subscription" element={<Subscription />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/user-guide" element={<UserGuide />} />
                    <Route path="/brain-dump" element={<BrainDump />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </HashRouter>
              </VoiceFormProvider></VoiceCommandProvider>
            </AuthProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);
 
export default App;
