import { AlertCircle, RefreshCw } from 'lucide-react';
import { environment } from '@/config/environment';

/**
 * Props for ComponentErrorFallback component
 */
interface ComponentErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

/**
 * Component-level error fallback UI.
 * Displays when errors occur in specific components (MapView, LiveFeed, etc.).
 * 
 * Requirements: 4.5, 4.6
 */
export function ComponentErrorFallback({ error, onReset }: ComponentErrorFallbackProps) {
  const isDev = environment.ENABLE_DEBUG_LOGGING;

  return (
    <div className="flex items-center justify-center h-full min-h-[200px] p-6 bg-card border border-border rounded-lg">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Component Error
        </h2>
        
        <p className="text-sm text-muted-foreground mb-4">
          This component encountered an error and couldn't render properly.
        </p>
        
        <div className="bg-muted/50 rounded-md p-3 mb-4 text-left">
          <p className="text-xs font-mono text-foreground break-words">
            {error.message}
          </p>
        </div>

        {isDev && error.stack && (
          <details className="mb-4 text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground mb-2">
              Stack trace (development only)
            </summary>
            <pre className="text-xs font-mono bg-muted/50 rounded-md p-3 overflow-x-auto text-left">
              {error.stack}
            </pre>
          </details>
        )}

        <button
          onClick={onReset}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );
}
