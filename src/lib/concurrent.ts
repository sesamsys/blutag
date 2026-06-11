/**
 * Run an async `worker` over `items` with at most `limit` tasks in flight.
 * Preserves input order in the returned array. If any task throws, the
 * first error is re-thrown after all in-flight tasks settle.
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
  let cursor = 0;
  let firstError: unknown = undefined;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      try {
        results[i] = await worker(items[i], i);
      } catch (err) {
        if (firstError === undefined) firstError = err;
      }
    }
  });

  await Promise.all(runners);
  if (firstError !== undefined) throw firstError;
  return results;
}
