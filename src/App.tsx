import React, { Suspense } from "react";
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
import { NovaFloat } from "./components/NovaFloat";
import { useExtensionBridge } from "./hooks/useExtensionBridge";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { useOfflineSync } from "./hooks/useOfflineSync";
import { KeyboardShortcutsProvider } from "./contexts/KeyboardShortcutsContext";
import { PwaInstallBanner } from "./components/PwaInstallBanner";
import { QuickCaptureOverlay } from "./components/QuickCaptureOverlay";
import { OfflineIndicator } from "./components/OfflineIndicator";

const Index = React.lazy(() => import("./pages/Index"));
const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const AllEntries = React.lazy(() => import("./pages/AllEntries"));
const CategoryPage = React.lazy(() => import("./pages/CategoryPage"));
const Subscription = React.lazy(() => import("./pages/Subscription"));
const Settings = React.lazy(() => import("./pages/Settings"));
const UserGuide = React.lazy(() => import("./pages/UserGuide"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const TermsOfService = React.lazy(() => import("./pages/TermsOfService"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy"));
const BrainDump = React.lazy(() => import("./pages/BrainDump"));
const Insights = React.lazy(() => import("./pages/Insights"));
const NovaBriefing = React.lazy(() => import("./pages/NovaBriefing"));
const Onboarding = React.lazy(() => import("./pages/Onboarding"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-12 h-12 border border-border flex items-center justify-center mx-auto mb-4 animate-pulse rounded-lg">
        <span className="text-primary text-lg font-semibold">S</span>
      </div>
      <p className="text-xs text-muted-foreground">Loading...</p>
    </div>
  </div>
);

const GlobalProviders: React.FC = () => {
  useExtensionBridge();
  useGlobalShortcuts();
  useOfflineSync();
  return null;
};

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
                <KeyboardShortcutsProvider>
                  <HashRouter>
                    <GlobalProviders />
                    <VoiceNavigationListener />
                    <NovaFloat />
                    <QuickCaptureOverlay />
                    <PwaInstallBanner />
                    <OfflineIndicator />

                    <Suspense fallback={<PageLoader />}>
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
                        <Route path="/briefing" element={<NovaBriefing />} />
                        <Route path="/subscription" element={<Subscription />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/user-guide" element={<UserGuide />} />
                        <Route path="/brain-dump" element={<BrainDump />} />
                        <Route path="/onboarding" element={<Onboarding />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/share" element={<Dashboard />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </HashRouter>
                </KeyboardShortcutsProvider>
              </VoiceFormProvider>
            </AuthProvider>
          </ErrorBoundary>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
