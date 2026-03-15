import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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
      vi.useFakeTimers();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("fail 1"))
        .mockRejectedValueOnce(new Error("fail 2"))
        .mockResolvedValue("success");
      
      const promise = retryWithBackoff(fn, { 
        maxAttempts: 3, 
        initialDelayMs: 1,
        shouldRetry: () => true
      });
      
      await vi.advanceTimersByTimeAsync(10);
      const result = await promise;
      
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
      vi.useRealTimers();
    });

    it("should throw after max attempts", async () => {
      vi.useFakeTimers();
      const fn = vi.fn().mockRejectedValue(new Error("always fails"));
      
      const promise = retryWithBackoff(fn, { 
        maxAttempts: 2, 
        initialDelayMs: 1,
        shouldRetry: () => true
      });

      await vi.advanceTimersByTimeAsync(10);
      
      await expect(promise).rejects.toThrow("always fails");
      expect(fn).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it("should call onRetry callback", async () => {
      vi.useFakeTimers();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("fail"))
        .mockResolvedValue("success");
      const onRetry = vi.fn();
      
      const promise = retryWithBackoff(fn, { 
        maxAttempts: 2, 
        initialDelayMs: 1,
        shouldRetry: () => true,
        onRetry 
      });
      
      await vi.advanceTimersByTimeAsync(10);
      await promise;
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
      vi.useRealTimers();
    });

    it("should not retry non-retryable errors", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("quota exceeded 402"));
      
      await expect(
        retryWithBackoff(fn, { maxAttempts: 3, initialDelayMs: 1 })
      ).rejects.toThrow("quota exceeded");
      
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry network errors by default", async () => {
      vi.useFakeTimers();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("network failed"))
        .mockResolvedValue("success");
      
      const promise = retryWithBackoff(fn, { 
        maxAttempts: 2, 
        initialDelayMs: 1
      });
      
      await vi.advanceTimersByTimeAsync(10);
      const result = await promise;
      
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });
  });


  describe("withTimeout", () => {
    it("should resolve if function completes before timeout", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await withTimeout(fn, 1000);
      
      expect(result).toBe("success");
    });

    it("should reject if function exceeds timeout", async () => {
      vi.useFakeTimers();
      const fn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve("too slow"), 200))
      );
      
      const promise = withTimeout(fn, 50);
      await vi.advanceTimersByTimeAsync(50);
      
      await expect(promise).rejects.toThrow("Operation timed out");
      vi.useRealTimers();
    });

    it("should use custom timeout error", async () => {
      vi.useFakeTimers();
      const fn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve("too slow"), 200))
      );
      const customError = new Error("Custom timeout");
      
      const promise = withTimeout(fn, 50, customError);
      await vi.advanceTimersByTimeAsync(50);
      
      await expect(promise).rejects.toThrow("Custom timeout");
      vi.useRealTimers();
    });
  });

  describe("retryWithTimeout", () => {
    it("should combine retry and timeout", async () => {
      vi.useFakeTimers();
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("network failed"))
        .mockResolvedValue("success");
      
      const promise = retryWithTimeout(fn, 1000, { 
        maxAttempts: 2, 
        initialDelayMs: 1
      });
      
      await vi.advanceTimersByTimeAsync(10);
      const result = await promise;
      
      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
      vi.useRealTimers();
    });

    it("should timeout if function takes too long", async () => {
      vi.useFakeTimers();
      const fn = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve("too slow"), 200))
      );
      
      const promise = retryWithTimeout(fn, 50, { maxAttempts: 1 });
      await vi.advanceTimersByTimeAsync(50);
      
      await expect(promise).rejects.toThrow("Operation timed out");
      vi.useRealTimers();
    });
  });
});
