/**
 * Client-side sliding window rate limiter.
 *
 * Tracks timestamps of recent calls within a time window and rejects
 * new calls once the maximum number of allowed calls is reached.
 *
 * @example
 * ```ts
 * const limiter = createRateLimiter({ maxCalls: 5, windowMs: 60_000 });
 *
 * if (!limiter.canProceed()) {
 *   const wait = limiter.msUntilNextSlot();
 *   toast.error(`Too many requests. Try again in ${Math.ceil(wait / 1000)}s.`);
 *   return;
 * }
 * limiter.record();
 * ```
 */

export interface RateLimiterOptions {
  /** Maximum number of calls allowed within the window */
  maxCalls: number;
  /** Sliding window duration in milliseconds */
  windowMs: number;
}

export interface RateLimiter {
  /** Returns true if a new call is allowed right now */
  canProceed: () => boolean;
  /** Records a new call timestamp — call this when proceeding */
  record: () => void;
  /** Milliseconds until the next slot opens (0 if already available) */
  msUntilNextSlot: () => number;
  /** Resets all recorded timestamps */
  reset: () => void;
  /** Returns the number of calls in the current window */
  currentCount: () => number;
}

export function createRateLimiter(
  options: RateLimiterOptions,
  /** Overridable clock for testing */
  now: () => number = Date.now
): RateLimiter {
  const { maxCalls, windowMs } = options;
  let timestamps: number[] = [];

  /** Remove timestamps outside the current window */
  function prune() {
    const cutoff = now() - windowMs;
    timestamps = timestamps.filter((t) => t > cutoff);
  }

  function canProceed(): boolean {
    prune();
    return timestamps.length < maxCalls;
  }

  function record(): void {
    prune();
    timestamps.push(now());
  }

  function msUntilNextSlot(): number {
    prune();
    if (timestamps.length < maxCalls) return 0;
    // Oldest timestamp in window determines when the next slot opens
    const oldest = timestamps[0];
    return Math.max(0, oldest + windowMs - now());
  }

  function reset(): void {
    timestamps = [];
  }

  function currentCount(): number {
    prune();
    return timestamps.length;
  }

  return { canProceed, record, msUntilNextSlot, reset, currentCount };
}
