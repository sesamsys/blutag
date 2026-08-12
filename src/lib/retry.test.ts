import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { retryWithBackoff, withTimeout, retryWithTimeout } from "./retry";

describe("retry utilities", () => {
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
        initialDelayMs: 5,
        shouldRetry: () => true,
      });

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it("should throw after max attempts", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("always fails"));

      await expect(
        retryWithBackoff(fn, {
          maxAttempts: 2,
          initialDelayMs: 5,
          shouldRetry: () => true,
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
        initialDelayMs: 5,
        shouldRetry: () => true,
        onRetry,
      });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(expect.any(Error), 1);
    });

    it("should not retry non-retryable errors", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("quota exceeded 402"));

      await expect(
        retryWithBackoff(fn, { maxAttempts: 3, initialDelayMs: 5 })
      ).rejects.toThrow("quota exceeded");

      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should retry network errors by default", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("network failed"))
        .mockResolvedValue("success");

      const result = await retryWithBackoff(fn, {
        maxAttempts: 2,
        initialDelayMs: 5,
      });

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe("withTimeout", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(async () => {
      await vi.runAllTimersAsync();
      vi.useRealTimers();
    });

    it("should resolve if function completes before timeout", async () => {
      const fn = vi.fn().mockResolvedValue("success");
      const result = await withTimeout(fn, 1000);

      expect(result).toBe("success");
    });

    it("should reject if function exceeds timeout", async () => {
      // A promise that never settles — attaching .catch(noop) prevents the
      // "unhandled rejection" warning when Promise.race picks the timeout.
      const noop = () => {};
      const slow = new Promise(() => {});
      (slow as Promise<unknown>).catch(noop);
      const fn = vi.fn().mockReturnValue(slow);

      const promise = withTimeout(fn, 100);
      await vi.advanceTimersByTimeAsync(200);
      await expect(promise).rejects.toThrow("Operation timed out");
    });

    it("should use custom timeout error", async () => {
      const noop = () => {};
      const slow = new Promise(() => {});
      (slow as Promise<unknown>).catch(noop);
      const fn = vi.fn().mockReturnValue(slow);
      const customError = new Error("Custom timeout");

      const promise = withTimeout(fn, 100, customError);
      await vi.advanceTimersByTimeAsync(200);
      await expect(promise).rejects.toThrow("Custom timeout");
    });
  });

  describe("retryWithTimeout", () => {
    it("should combine retry and timeout", async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error("network failed"))
        .mockResolvedValue("success");

      const result = await retryWithTimeout(fn, 1000, {
        maxAttempts: 2,
        initialDelayMs: 5,
      });

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should timeout if function takes too long", async () => {
      vi.useFakeTimers();
      try {
        const noop = () => {};
        const slow = new Promise(() => {});
        (slow as Promise<unknown>).catch(noop);
        const fn = vi.fn().mockReturnValue(slow);

        const promise = retryWithTimeout(fn, 100, { maxAttempts: 1 });
        await vi.advanceTimersByTimeAsync(200);
        await expect(promise).rejects.toThrow("Operation timed out");
        await vi.runAllTimersAsync();
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
