
import React, { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { VoiceFormProvider } from "./contexts/VoiceFormContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { ThemeBootstrapper } from "./components/ThemeBootstrapper";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { VoiceNavigationListener } from "./components/voice/VoiceNavigationListener";

// Eagerly loaded (landing + auth - needed immediately)
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";

// Lazy loaded (behind auth or rarely visited)
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AllEntries = lazy(() => import("./pages/AllEntries"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Settings = lazy(() => import("./pages/Settings"));
const UserGuide = lazy(() => import("./pages/UserGuide"));
const BrainDump = lazy(() => import("./pages/BrainDump"));
const AskVault = lazy(() => import("./pages/AskVault"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

const queryClient = new QueryClient();

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="mono text-sm text-muted-foreground tracking-wider">LOADING...</div>
  </div>
);

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
              <VoiceFormProvider>
                <HashRouter>
                  <VoiceNavigationListener />
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/" element={<Index />} />
                      <Route path="/login" element={<Login />} />
                      <Route path="/signup" element={<Signup />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/all-entries" element={<AllEntries />} />
                      <Route path="/all-entries/:entryId" element={<AllEntries />} />
                      <Route path="/category/:categoryName" element={<CategoryPage />} />
                      <Route path="/subscription" element={<Subscription />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/user-guide" element={<UserGuide />} />
                      <Route path="/brain-dump" element={<BrainDump />} />
                      <Route path="/ask-vault" element={<AskVault />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      <Route path="/terms" element={<TermsOfService />} />
                      <Route path="/privacy" element={<PrivacyPolicy />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </HashRouter>
              </VoiceFormProvider>
            </AuthProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
