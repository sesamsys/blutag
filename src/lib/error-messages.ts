/**
 * Centralized error messages for consistent user-facing error handling.
 */

export const ERROR_MESSAGES = {
  // Network errors
  NETWORK_ERROR: "Unable to connect. Please check your internet connection and try again.",
  TIMEOUT_ERROR: "The request took too long. Please try again.",
  
  // Photo upload errors
  PHOTO_TOO_LARGE: (maxMB: number) => `Photo is too large. Maximum size is ${maxMB}MB.`,
  PHOTO_INVALID_TYPE: "Invalid file type. Please upload an image file (JPEG, PNG, etc.).",
  PHOTO_UPLOAD_FAILED: "Failed to upload photo. Please try again.",
  PHOTO_COMPRESSION_FAILED: "Failed to compress image. The file may be corrupted.",
  
  // Alt text generation errors
  ALT_TEXT_GENERATION_FAILED: "Failed to generate alt text. Please try again.",
  ALT_TEXT_RATE_LIMIT: "Too many requests. Please wait a moment and try again.",
  ALT_TEXT_QUOTA_EXCEEDED: "AI service quota exceeded. Please try again later.",
  ALT_TEXT_SERVICE_ERROR: "AI service is temporarily unavailable. Please try again in a few moments.",
  
  // Bluesky authentication errors
  AUTH_FAILED: "Sign-in failed. Please try again.",
  AUTH_INVALID_HANDLE: (handle: string) => `Could not find Bluesky account "${handle}". Please check the handle and try again.`,
  AUTH_CLIENT_METADATA_ERROR: "Unable to verify app identity. Please ensure you're using a stable domain.",
  AUTH_SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  AUTH_TOKEN_REFRESH_FAILED: "Failed to refresh authentication. Please sign in again.",
  
  // Bluesky posting errors
  POST_FAILED: "Failed to post to Bluesky. Please try again.",
  POST_IMAGE_UPLOAD_FAILED: "Failed to upload images to Bluesky. Please try again.",
  POST_TOO_LONG: (maxLength: number) => `Post text is too long. Maximum length is ${maxLength} characters.`,
  POST_NO_IMAGES: "Please add at least one photo before posting.",
  POST_NO_ALT_TEXT: "Please generate alt text for all photos before posting.",
  
  // Session persistence errors
  SESSION_SAVE_FAILED: "Failed to save your session. Your work may not be preserved if you navigate away.",
  SESSION_LOAD_FAILED: "Failed to restore your previous session.",
  
  // EXIF errors
  EXIF_EXTRACTION_FAILED: "Failed to read photo metadata. Alt text will be generated without context.",
  
  // Generic errors
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again.",
  OPERATION_CANCELLED: "Operation was cancelled.",
} as const;

/**
 * Error types for categorizing errors
 */
export enum ErrorType {
  NETWORK = "network",
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  AUTHORIZATION = "authorization",
  RATE_LIMIT = "rate_limit",
  QUOTA = "quota",
  SERVICE = "service",
  UNKNOWN = "unknown",
}

/**
 * Structured error class for better error handling
 */
export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType = ErrorType.UNKNOWN,
    public originalError?: unknown,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Parse error from various sources and return user-friendly message
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    // Check for specific error patterns
    const message = error.message.toLowerCase();
    
    if (message.includes("network") || message.includes("fetch")) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    
    if (message.includes("timeout")) {
      return ERROR_MESSAGES.TIMEOUT_ERROR;
    }
    
    if (message.includes("rate limit") || message.includes("429")) {
      return ERROR_MESSAGES.ALT_TEXT_RATE_LIMIT;
    }
    
    if (message.includes("quota") || message.includes("402")) {
      return ERROR_MESSAGES.ALT_TEXT_QUOTA_EXCEEDED;
    }
    
    if (message.includes("resolve") || message.includes("handle")) {
      return ERROR_MESSAGES.AUTH_FAILED;
    }
    
    if (message.includes("client_metadata")) {
      return ERROR_MESSAGES.AUTH_CLIENT_METADATA_ERROR;
    }
    
    // Return the original error message if it's user-friendly
    if (error.message.length < 200 && !message.includes("undefined")) {
      return error.message;
    }
  }

  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

/**
 * Determine error type from error object
 */
export function getErrorType(error: unknown): ErrorType {
  if (error instanceof AppError) {
    return error.type;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    if (message.includes("network") || message.includes("fetch")) {
      return ErrorType.NETWORK;
    }
    
    if (message.includes("rate limit") || message.includes("429")) {
      return ErrorType.RATE_LIMIT;
    }
    
    if (message.includes("quota") || message.includes("402")) {
      return ErrorType.QUOTA;
    }
    
    if (message.includes("auth") || message.includes("token")) {
      return ErrorType.AUTHENTICATION;
    }
  }

  return ErrorType.UNKNOWN;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AppError) {
    return error.retryable;
  }

  const type = getErrorType(error);
  
  // Network, service, and rate limit errors are retryable
  return [
    ErrorType.NETWORK,
    ErrorType.SERVICE,
    ErrorType.RATE_LIMIT,
  ].includes(type);
}

/**
 * Log error to console with context (in development) or to error tracking service (in production)
 */
export function logError(error: unknown, context?: Record<string, unknown>): void {
  console.error("Error:", error, context);
  
  // TODO: In production, send to error tracking service (Sentry, LogRocket, etc.)
  // if (process.env.NODE_ENV === "production") {
  //   Sentry.captureException(error, { extra: context });
  // }
}
