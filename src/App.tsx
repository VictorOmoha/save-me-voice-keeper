import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
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

import { QuickCaptureOverlay } from "./components/QuickCaptureOverlay";
import { OfflineIndicator } from "./components/OfflineIndicator";
import PrivateRoute from "./components/PrivateRoute";

const Index = React.lazy(() => import("./pages/Index.tsx"));
const Login = React.lazy(() => import("./pages/Login.tsx"));
const Signup = React.lazy(() => import("./pages/Signup.tsx"));
const ResetPassword = React.lazy(() => import("./pages/ResetPassword.tsx"));
const Dashboard = React.lazy(() => import("./pages/Dashboard.tsx"));
const AllEntries = React.lazy(() => import("./pages/AllEntries.tsx"));
const CategoryPage = React.lazy(() => import("./pages/CategoryPage.tsx"));
const Subscription = React.lazy(() => import("./pages/Subscription.tsx"));
const Settings = React.lazy(() => import("./pages/Settings.tsx"));
const UserGuide = React.lazy(() => import("./pages/UserGuide.tsx"));
const NotFound = React.lazy(() => import("./pages/NotFound.tsx"));
const TermsOfService = React.lazy(() => import("./pages/TermsOfService.tsx"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy.tsx"));
const BrainDump = React.lazy(() => import("./pages/BrainDump.tsx"));
const Insights = React.lazy(() => import("./pages/Insights.tsx"));
const NovaBriefing = React.lazy(() => import("./pages/NovaBriefing.tsx"));
const Onboarding = React.lazy(() => import("./pages/Onboarding.tsx"));

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

/**
 * The app used HashRouter until mid-2026, so bookmarks, PWA shortcuts, and
 * shared links in the wild look like /#/dashboard. Rewrite them onto real
 * paths once on load so they keep working under BrowserRouter.
 */
const LegacyHashRedirect: React.FC = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    const { hash } = window.location;
    if (hash.startsWith("#/")) {
      navigate(hash.slice(1), { replace: true });
    }
  }, [navigate]);
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
                  <BrowserRouter>
                    <LegacyHashRedirect />
                    <GlobalProviders />
                    <VoiceNavigationListener />
                    <NovaFloat />
                    <QuickCaptureOverlay />
                    <OfflineIndicator />

                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/all-entries" element={<PrivateRoute><AllEntries /></PrivateRoute>} />
                        <Route path="/all-entries/:entryId" element={<PrivateRoute><AllEntries /></PrivateRoute>} />
                        <Route path="/category/:categoryName" element={<PrivateRoute><CategoryPage /></PrivateRoute>} />
                        <Route path="/insights" element={<PrivateRoute><Insights /></PrivateRoute>} />
                        <Route path="/briefing" element={<PrivateRoute><NovaBriefing /></PrivateRoute>} />
                        <Route path="/subscription" element={<PrivateRoute><Subscription /></PrivateRoute>} />
                        <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                        <Route path="/connect-agent" element={<Navigate to="/settings?tab=automation&connect=agent" replace />} />
                        <Route path="/user-guide" element={<UserGuide />} />
                        <Route path="/brain-dump" element={<PrivateRoute><BrainDump /></PrivateRoute>} />
                        <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/share" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </BrowserRouter>
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
