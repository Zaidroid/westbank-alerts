// Environment configuration module for API integration
// Provides type-safe access to environment variables with validation

export interface EnvironmentConfig {
  API_BASE_URL: string;
  WS_BASE_URL: string;
  API_VERSION: string;
  ENABLE_MOCK_DATA: boolean;
  ENABLE_DEBUG_LOGGING: boolean;
}

export const environment: EnvironmentConfig = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || '',
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || '',
  API_VERSION: import.meta.env.VITE_API_VERSION || 'v1',
  ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
  ENABLE_DEBUG_LOGGING: import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true',
};

/**
 * Validates that all required environment variables are set.
 * Throws an error if any required variables are missing in production builds.
 * 
 * @throws {Error} If required environment variables are missing
 */
export function validateEnvironment(): void {
  const required = ['API_BASE_URL'] as const;
  const missing = required.filter(key => !environment[key] && !import.meta.env.DEV);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file and ensure all required variables are set.'
    );
  }
}

// Call validation on module load in production
if (import.meta.env.PROD) {
  validateEnvironment();
}
