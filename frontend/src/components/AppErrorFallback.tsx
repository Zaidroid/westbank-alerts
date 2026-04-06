import { AlertTriangle } from 'lucide-react';
import { environment } from '@/config/environment';

/**
 * Props for AppErrorFallback component
 */
interface AppErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

/**
 * Application-level error fallback UI.
 * Displays when critical errors occur at the app root level.
 * 
 * Requirements: 4.5, 4.6
 */
export function AppErrorFallback({ error, onReset }: AppErrorFallbackProps) {
  const isDev = environment.ENABLE_DEBUG_LOGGING;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-md w-full">
        <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold text-foreground mb-2">
                Application Error
              </h1>
              <p className="text-sm text-muted-foreground mb-4">
                The application encountered an unexpected error and cannot continue.
              </p>
              
              <div className="bg-muted/50 rounded-md p-3 mb-4">
                <p className="text-sm font-mono text-foreground break-words">
                  {error.message}
                </p>
              </div>

              {isDev && error.stack && (
                <details className="mb-4">
                  <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground mb-2">
                    Stack trace (development only)
                  </summary>
                  <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto">
                    {error.stack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onReset}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
                >
                  Retry
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="flex-1 px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors font-medium text-sm"
                >
                  Reload Page
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
