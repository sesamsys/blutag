import { describe, it, expect, vi, beforeEach } from "vitest";
import { retryWithBackoff, withTimeout, retryWithTimeout } from "./retry";

describe("retry utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("retryWithBackoff", () => {
    it("should succeed on first attempt", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await retryWithBackoff(fn);
      
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry on failure and eventually succeed", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValue("success");
      
      const result = await retryWithBackoff(fn, { 
        maxAttempts: 3, 
        initialDelayMs: 1,
        shouldRetry: () => true // Always retry for this test
      });
      
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should throw after max attempts", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("always fails"));
      
      await expect(
        retryWithBackoff(fn, { 
          maxAttempts: 2, 
          initialDelayMs: 1,
          shouldRetry: () => true // Always retry for this test
        })
      ).rejects.toThrow("always fails");
      
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should call onRetry callback", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("success");
      const onRetry = vi.fn();
      
      await retryWithBackoff(fn, { 
        maxAttempts: 2, 
        initialDelayMs: 1,
        shouldRetry: () => true, // Always retry for this test
        onRetry 
      });
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it("should not retry non-retryable errors", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("quota exceeded 402"));
      
      await expect(
        retryWithBackoff(fn, { maxAttempts: 3, initialDelayMs: 1 })
      ).rejects.toThrow("quota exceeded");
      
      // Should only be called once since quota errors aren't retryable
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry network errors by default", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("network failed"))
        .mockResolvedValue("success");
      
      const result = await retryWithBackoff(fn, { 
        maxAttempts: 2, 
        initialDelayMs: 1
      });
      
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });


  describe("withTimeout", () => {
    it("should resolve if function completes before timeout", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await withTimeout(fn, 1000);
      
      expect(result).toBe("success");
    });

    it("should reject if function exceeds timeout", async () => {
      const fn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve("too slow"), 200))
      );
      
      await expect(
        withTimeout(fn, 50)
      ).rejects.toThrow("Operation timed out");
    });

    it("should use custom timeout error", async () => {
      const fn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve("too slow"), 200))
      );
      const customError = new Error("Custom timeout");
      
      await expect(
        withTimeout(fn, 50, customError)
      ).rejects.toThrow("Custom timeout");
    });
  });

  describe("retryWithTimeout", () => {
    it("should combine retry and timeout", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("network failed"))
        .mockResolvedValue("success");
      
      const result = await retryWithTimeout(fn, 1000, { 
        maxAttempts: 2, 
        initialDelayMs: 1
      });
      
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should timeout if function takes too long", async () => {
      const fn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve("too slow"), 200))
      );
      
      await expect(
        retryWithTimeout(fn, 50, { maxAttempts: 1 })
      ).rejects.toThrow("Operation timed out");
    });
  });
});
