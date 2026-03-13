import { describe, it, expect } from "vitest";
import {
  ERROR_MESSAGES,
  ErrorType,
  AppError,
  getErrorMessage,
  getErrorType,
  isRetryableError,
} from "./error-messages";

describe("error-messages", () => {
  describe("AppError", () => {
    it("should create error with message and type", () => {
      const error = new AppError("Test error", ErrorType.NETWORK);
      
      expect(error.message).toBe("Test error");
      expect(error.type).toBe(ErrorType.NETWORK);
      expect(error.retryable).toBe(true);
      expect(error.name).toBe("AppError");
    });

    it("should support non-retryable errors", () => {
      const error = new AppError("Quota exceeded", ErrorType.QUOTA, undefined, false);
      
      expect(error.retryable).toBe(false);
    });

    it("should store original error", () => {
      const original = new Error("Original");
      const error = new AppError("Wrapped", ErrorType.UNKNOWN, original);
      
      expect(error.originalError).toBe(original);
    });
  });

  describe("getErrorMessage", () => {
    it("should return message from AppError", () => {
      const error = new AppError("Custom message", ErrorType.NETWORK);
      expect(getErrorMessage(error)).toBe("Custom message");
    });

    it("should detect network errors", () => {
      const error = new Error("Network request failed");
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.NETWORK_ERROR);
    });

    it("should detect timeout errors", () => {
      const error = new Error("Request timeout");
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.TIMEOUT_ERROR);
    });


    it("should detect rate limit errors", () => {
      const error = new Error("Rate limit exceeded (429)");
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.ALT_TEXT_RATE_LIMIT);
    });

    it("should detect quota errors", () => {
      const error = new Error("Quota exceeded (402)");
      expect(getErrorMessage(error)).toBe(ERROR_MESSAGES.ALT_TEXT_QUOTA_EXCEEDED);
    });

    it("should return original message if user-friendly", () => {
      const error = new Error("Some random error");
      // Short, user-friendly messages are returned as-is
      expect(getErrorMessage(error)).toBe("Some random error");
    });

    it("should handle non-Error objects", () => {
      expect(getErrorMessage("string error")).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
      expect(getErrorMessage(null)).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
      expect(getErrorMessage(undefined)).toBe(ERROR_MESSAGES.UNKNOWN_ERROR);
    });
  });

  describe("getErrorType", () => {
    it("should return type from AppError", () => {
      const error = new AppError("Test", ErrorType.AUTHENTICATION);
      expect(getErrorType(error)).toBe(ErrorType.AUTHENTICATION);
    });

    it("should detect network errors", () => {
      const error = new Error("fetch failed");
      expect(getErrorType(error)).toBe(ErrorType.NETWORK);
    });

    it("should detect rate limit errors", () => {
      const error = new Error("429 rate limit");
      expect(getErrorType(error)).toBe(ErrorType.RATE_LIMIT);
    });

    it("should return UNKNOWN for unrecognized errors", () => {
      const error = new Error("random error");
      expect(getErrorType(error)).toBe(ErrorType.UNKNOWN);
    });
  });


  describe("isRetryableError", () => {
    it("should return retryable flag from AppError", () => {
      const retryable = new AppError("Test", ErrorType.NETWORK, undefined, true);
      const notRetryable = new AppError("Test", ErrorType.QUOTA, undefined, false);
      
      expect(isRetryableError(retryable)).toBe(true);
      expect(isRetryableError(notRetryable)).toBe(false);
    });

    it("should consider network errors retryable", () => {
      const error = new Error("network failed");
      expect(isRetryableError(error)).toBe(true);
    });

    it("should consider rate limit errors retryable", () => {
      const error = new Error("429 rate limit");
      expect(isRetryableError(error)).toBe(true);
    });

    it("should consider quota errors not retryable", () => {
      const error = new Error("402 quota exceeded");
      expect(isRetryableError(error)).toBe(false);
    });

    it("should consider unknown errors not retryable", () => {
      const error = new Error("random error");
      expect(isRetryableError(error)).toBe(false);
    });
  });
});
