import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Props for VersionMismatchError component
 */
interface VersionMismatchErrorProps {
  currentVersion: string;
  requiredVersion: string;
}

/**
 * Error component displayed when API version mismatch is detected (HTTP 426).
 * Shows current and required versions with refresh button.
 * 
 * Requirements: 21.5, 21.6, 21.7
 */
export function VersionMismatchError({ currentVersion, requiredVersion }: VersionMismatchErrorProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-warning" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Version Mismatch
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                The application version is outdated and needs to be updated to continue.
              </p>
              
              <div className="bg-muted/50 rounded-md p-3 mb-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Current version:</span>
                  <span className="font-mono font-medium text-foreground">{currentVersion}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Required version:</span>
                  <span className="font-mono font-medium text-primary">{requiredVersion}</span>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
