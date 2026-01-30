// Error handling utilities

// Generic error handler with logging
export const handleError = (error: any, errorMessage: string): void => {
  console.error(`${errorMessage}:`, error);
};

// Higher-order function for error handling
export const withErrorHandling = <T>(
  fn: () => Promise<T>,
  errorMessage: string,
  fallbackValue: T
): Promise<T> => {
  return fn().catch(error => {
    handleError(error, errorMessage);
    return fallbackValue;
  });
};

// Safe JSON parser with error handling
export const safeJSONParse = <T>(jsonString: string, fallbackValue: T): T => {
  try {
    return JSON.parse(jsonString) as T;
  } catch (error) {
    handleError(error, 'Error parsing JSON');
    return fallbackValue;
  }
};