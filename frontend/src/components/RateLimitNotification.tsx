import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';

/**
 * Props for RateLimitNotification component
 */
interface RateLimitNotificationProps {
  retryAfter: number; // seconds until retry allowed
  onComplete?: () => void;
}

/**
 * Notification component that displays rate limit countdown timer.
 * Shows remaining time until requests can be retried.
 * 
 * Requirements: 22.1, 22.2, 22.3, 22.4
 */
export function RateLimitNotification({ retryAfter, onComplete }: RateLimitNotificationProps) {
  const [remainingSeconds, setRemainingSeconds] = useState(retryAfter);

  useEffect(() => {
    setRemainingSeconds(retryAfter);
  }, [retryAfter]);

  useEffect(() => {
    if (remainingSeconds <= 0) {
      onComplete?.();
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds, onComplete]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md animate-in slide-in-from-top-2">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground mb-1">
              Too Many Requests
            </h3>
            <p className="text-xs text-muted-foreground mb-2">
              Please wait before making more requests.
            </p>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono font-medium text-foreground">
                {formatTime(remainingSeconds)}
              </span>
              <span className="text-xs text-muted-foreground">
                until retry
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
