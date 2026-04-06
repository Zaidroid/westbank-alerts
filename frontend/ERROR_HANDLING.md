# Error Handling System

This document describes the comprehensive error handling system implemented for the West Bank Alert System frontend.

## Overview

The error handling system provides:

1. **React Error Boundaries** - Catch and handle component errors gracefully
2. **User-Friendly Error Messages** - Translate technical errors to actionable guidance
3. **Rate Limit Handling** - Display countdown timers and reduce polling frequency
4. **API Version Mismatch Detection** - Detect and handle version incompatibilities
5. **Fallback UI Components** - Provide recovery options for users

## Components

### ErrorBoundary

React class component that catches JavaScript errors in child component tree.

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ComponentErrorFallback } from '@/components/ComponentErrorFallback';

<ErrorBoundary fallback={(error, reset) => <ComponentErrorFallback error={error} onReset={reset} />}>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Catches errors in child components
- Provides reset mechanism to retry
- Supports custom fallback UI
- Optional error callback for logging

### AppErrorFallback

Application-level error fallback UI for critical errors.

```tsx
import { AppErrorFallback } from '@/components/AppErrorFallback';

<ErrorBoundary fallback={(error, reset) => <AppErrorFallback error={error} onReset={reset} />}>
  <App />
</ErrorBoundary>
```

**Features:**
- Full-screen error display
- Shows error message and stack trace (dev only)
- Retry and reload page buttons
- Styled with appropriate error colors

### ComponentErrorFallback

Component-level error fallback UI for isolated component failures.

```tsx
import { ComponentErrorFallback } from '@/components/ComponentErrorFallback';

<ErrorBoundary fallback={(error, reset) => <ComponentErrorFallback error={error} onReset={reset} />}>
  <MapView />
</ErrorBoundary>
```

**Features:**
- Inline error display
- Preserves surrounding UI
- Retry button for recovery
- Stack trace in development mode

### RateLimitNotification

Notification component that displays rate limit countdown timer.

```tsx
import { RateLimitNotification } from '@/components/RateLimitNotification';

{isRateLimited && (
  <RateLimitNotification 
    retryAfter={retryAfter} 
    onComplete={clearRateLimit} 
  />
)}
```

**Features:**
- Countdown timer showing remaining seconds
- Formats time as minutes and seconds
- Auto-dismisses when countdown completes
- Fixed position notification

### VersionMismatchError

Full-screen overlay for API version mismatch errors (HTTP 426).

```tsx
import { VersionMismatchError } from '@/components/VersionMismatchError';

{hasVersionMismatch && (
  <VersionMismatchError 
    currentVersion={currentVersion} 
    requiredVersion={requiredVersion} 
  />
)}
```

**Features:**
- Shows current and required versions
- Refresh page button to reload application
- Blocks interaction until resolved
- Clear version comparison display

## Hooks

### useRateLimitHandler

Hook for managing rate limit state and polling frequency adjustments.

```tsx
import { useRateLimitHandler } from '@/hooks/useRateLimitHandler';

const { 
  isRateLimited, 
  retryAfter, 
  handleRateLimitError, 
  clearRateLimit,
  getPollingInterval 
} = useRateLimitHandler();

// In error handler
if (error instanceof RateLimitError) {
  handleRateLimitError(error);
}

// Adjust polling interval
const interval = getPollingInterval(30000); // Returns 60000 if rate limited
```

**Features:**
- Detects RateLimitError instances
- Extracts retry-after duration
- Reduces polling frequency during rate limit
- Logs rate limit events for debugging

### useVersionMismatch

Hook for detecting and handling API version mismatch (HTTP 426).

```tsx
import { useVersionMismatch } from '@/hooks/useVersionMismatch';

const { 
  hasVersionMismatch, 
  currentVersion, 
  requiredVersion, 
  checkVersionMismatch 
} = useVersionMismatch();

// In error handler
if (error.statusCode === 426) {
  checkVersionMismatch(error, responseBody);
}
```

**Features:**
- Detects HTTP 426 responses
- Extracts required version from response
- Compares with current version
- Logs version mismatch events

## Error Messages

User-friendly error message mapping for API errors.

```tsx
import { getErrorMessage, formatErrorForDisplay } from '@/lib/errorMessages';

const message = getErrorMessage(error);
// Returns: { title: string, description: string, action?: string }

const customMessage = formatErrorForDisplay(error, 'Custom description');
```

**Supported Error Types:**
- `NetworkError` - Connection failed
- `TimeoutError` - Request timeout
- `NotFoundError` - Resource not found
- `AuthenticationError` - Authentication required
- `RateLimitError` - Too many requests
- `ServerError` - Server error
- `APIError` - Generic API error

## Usage Examples

### Basic Error Boundary

```tsx
import { ErrorBoundary, ComponentErrorFallback } from '@/lib/errorHandling';

function Dashboard() {
  return (
    <ErrorBoundary fallback={(error, reset) => (
      <ComponentErrorFallback error={error} onReset={reset} />
    )}>
      <MapView />
    </ErrorBoundary>
  );
}
```

### Rate Limit Handling

```tsx
import { useRateLimitHandler } from '@/hooks/useRateLimitHandler';
import { RateLimitNotification } from '@/components/RateLimitNotification';
import { RateLimitError } from '@/lib/api/errors';

function App() {
  const { isRateLimited, retryAfter, handleRateLimitError, clearRateLimit } = useRateLimitHandler();

  // In your API call error handler
  const handleError = (error: Error) => {
    if (handleRateLimitError(error)) {
      // Rate limit detected and handled
      return;
    }
    // Handle other errors
  };

  return (
    <>
      <YourApp />
      {isRateLimited && (
        <RateLimitNotification 
          retryAfter={retryAfter} 
          onComplete={clearRateLimit} 
        />
      )}
    </>
  );
}
```

### Version Mismatch Detection

```tsx
import { useVersionMismatch } from '@/hooks/useVersionMismatch';
import { VersionMismatchError } from '@/components/VersionMismatchError';

function App() {
  const { hasVersionMismatch, currentVersion, requiredVersion, checkVersionMismatch } = useVersionMismatch();

  // In your API client response interceptor
  const handleResponse = (response: Response) => {
    if (response.status === 426) {
      response.json().then(body => {
        checkVersionMismatch(new Error('Version mismatch'), body);
      });
    }
  };

  return (
    <>
      <YourApp />
      {hasVersionMismatch && (
        <VersionMismatchError 
          currentVersion={currentVersion} 
          requiredVersion={requiredVersion} 
        />
      )}
    </>
  );
}
```

### Custom Error Logging

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Send to error tracking service
    console.error('Error caught by boundary:', error, errorInfo);
    // Example: Sentry.captureException(error);
  };

  return (
    <ErrorBoundary onError={handleError}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Architecture

### Error Flow

```
Component Error
    ↓
ErrorBoundary catches error
    ↓
getDerivedStateFromError updates state
    ↓
componentDidCatch logs error
    ↓
Fallback UI rendered
    ↓
User clicks retry
    ↓
reset() clears error state
    ↓
Component re-renders
```

### Rate Limit Flow

```
API Request
    ↓
HTTP 429 Response
    ↓
RateLimitError thrown
    ↓
useRateLimitHandler detects error
    ↓
State updated with retry-after
    ↓
RateLimitNotification displayed
    ↓
Countdown timer runs
    ↓
onComplete callback fires
    ↓
State cleared, normal operation resumes
```

## Best Practices

1. **Wrap Critical Components** - Use ErrorBoundary around components that may fail independently
2. **Preserve State** - Error boundaries preserve state outside the failed component
3. **Provide Recovery** - Always include retry mechanisms in fallback UI
4. **Log Errors** - Use onError callback for error tracking services
5. **User-Friendly Messages** - Use errorMessages utility to translate technical errors
6. **Handle Rate Limits** - Reduce polling frequency during rate limit periods
7. **Version Checking** - Detect version mismatches and prompt users to refresh

## Testing

### Testing Error Boundaries

```tsx
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

test('catches and displays error', () => {
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

### Testing Rate Limit Handler

```tsx
import { renderHook, act } from '@testing-library/react';
import { useRateLimitHandler } from '@/hooks/useRateLimitHandler';
import { RateLimitError } from '@/lib/api/errors';

test('handles rate limit error', () => {
  const { result } = renderHook(() => useRateLimitHandler());
  
  act(() => {
    const error = new RateLimitError('Rate limited', 60);
    result.current.handleRateLimitError(error);
  });
  
  expect(result.current.isRateLimited).toBe(true);
  expect(result.current.retryAfter).toBe(60);
});
```

## Requirements Mapping

- **4.1, 4.2, 4.3** - Error boundaries wrap App, MapView, and LiveFeed
- **4.4** - ErrorBoundary implements getDerivedStateFromError and componentDidCatch
- **4.5** - Fallback UI components with error messages and retry buttons
- **4.6** - Reset mechanism to clear error state
- **4.7** - Error boundaries preserve state outside failed component
- **3.8** - User-friendly error messages with actionable guidance
- **21.5, 21.6, 21.7** - API version mismatch detection and handling
- **22.1-22.7** - Rate limit handling with countdown and polling adjustment
