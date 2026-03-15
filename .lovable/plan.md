

## Fix Retry Tests for Bun Compatibility

### Problem
4 retry tests fail under `bun test` because Bun's test runner handles `setTimeout`-based promises (the `sleep` function) differently than Node/Vitest. The `await sleep(1)` calls inside `retryWithBackoff` don't resolve properly, causing retries to never execute.

### Root Cause
Bun's runtime can behave differently with very short `setTimeout` delays (1ms) in test contexts. The retry loop awaits `sleep(delay)` but control never returns to execute subsequent loop iterations.

### Solution
Use `vi.useFakeTimers()` in the retry tests and advance timers between assertions. This makes the tests deterministic and runtime-agnostic.

### Changes

**`src/lib/retry.test.ts`** — Refactor failing tests to use fake timers:

1. **"should retry on failure and eventually succeed"** — Wrap with `vi.useFakeTimers()`, use `vi.advanceTimersByTimeAsync()` to flush sleep delays, restore with `vi.useRealTimers()` in cleanup.

2. **"should call onRetry callback"** — Same fake timer approach.

3. **"should retry network errors by default"** — Same fake timer approach.

4. **"should reject if function exceeds timeout"** — Use fake timers to advance past the timeout threshold.

Each test will follow this pattern:
```typescript
it("should retry on failure and eventually succeed", async () => {
  vi.useFakeTimers();
  const fn = vi.fn()
    .mockRejectedValueOnce(new Error("fail 1"))
    .mockRejectedValueOnce(new Error("fail 2"))
    .mockResolvedValue("success");

  const promise = retryWithBackoff(fn, {
    maxAttempts: 3,
    initialDelayMs: 1,
    shouldRetry: () => true,
  });

  await vi.advanceTimersByTimeAsync(10);
  const result = await promise;

  expect(result).toBe("success");
  expect(fn).toHaveBeenCalledTimes(3);
  vi.useRealTimers();
});
```

No production code changes needed — only test file updates.

