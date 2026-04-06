import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import MobileApp from "@/pages/MobileApp";
import { ThemeProvider } from "@/lib/theme";
import { LangProvider } from "@/lib/i18n";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppErrorFallback } from "@/components/AppErrorFallback";
import { RateLimitNotification } from "@/components/RateLimitNotification";
import { VersionMismatchError } from "@/components/VersionMismatchError";
import { PwaInstallPrompt } from "@/components/PwaInstallPrompt";
import { useRateLimitHandler } from "@/hooks/useRateLimitHandler";
import { useVersionMismatch } from "@/hooks/useVersionMismatch";
import { useIsMobile } from "@/hooks/use-mobile";
import { queryClient } from "@/lib/queryClient";

function Router() {
  const isMobile = useIsMobile();
  return (
    <Switch>
      <Route path="/" component={isMobile ? MobileApp : Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { isRateLimited, retryAfter, clearRateLimit } = useRateLimitHandler();
  const { hasVersionMismatch, currentVersion, requiredVersion } = useVersionMismatch();

  return (
    <ErrorBoundary fallback={(error, reset) => <AppErrorFallback error={error} onReset={reset} />}>
      <ThemeProvider>
        <LangProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
              
              {/* Rate limit notification */}
              {isRateLimited && (
                <RateLimitNotification 
                  retryAfter={retryAfter} 
                  onComplete={clearRateLimit} 
                />
              )}
              
              {/* Version mismatch error overlay */}
              {hasVersionMismatch && (
                <VersionMismatchError
                  currentVersion={currentVersion}
                  requiredVersion={requiredVersion}
                />
              )}

              {/* PWA install / update prompt */}
              <PwaInstallPrompt />
            </TooltipProvider>
          </QueryClientProvider>
        </LangProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
