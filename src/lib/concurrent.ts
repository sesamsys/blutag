/**
 * Run an async `worker` over `items` with at most `limit` tasks in flight.
 * Preserves input order in the returned array. If any task throws, the
 * first error *encountered* (by wall-clock time, not input index) is
 * re-thrown after all in-flight tasks settle — remaining tasks are still
 * allowed to complete so no work is abandoned mid-flight.
 *
 * @example
 *   const results = await runWithConcurrency(urls, 3, fetchOne);
 */
export async function runWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (limit <= 0) throw new Error("Concurrency limit must be > 0");
  const results = new Array<R>(items.length);
  // Shared cursor advanced by each runner — intentional work-stealing pattern.
  // Every runner atomically claims the next unclaimed index, so no item is
  // processed twice and no runner sits idle while work remains.
  let cursor = 0;
  // Symbol sentinel distinguishes "no error yet" from a worker that threw
  // `undefined` (unusual but valid JS), which would be silently swallowed
  // if we used `undefined` itself as the sentinel.
  const NO_ERROR = Symbol("no_error");
  let firstError: unknown = NO_ERROR;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        results[i] = await worker(items[i], i);
      } catch (err) {
        if (firstError === NO_ERROR) firstError = err;
      }
    }
  });

  await Promise.all(runners);
  if (firstError !== NO_ERROR) throw firstError;
  return results;
}
