import { describe, it, expect } from "vitest";
import { runWithConcurrency } from "./concurrent";

describe("runWithConcurrency", () => {
  it("preserves input order in results", async () => {
    const items = [10, 20, 30, 40, 50];
    const result = await runWithConcurrency(items, 2, async (n) => {
      await new Promise((r) => setTimeout(r, n % 30));
      return n * 2;
    });
    expect(result).toEqual([20, 40, 60, 80, 100]);
  });

  it("never exceeds the concurrency limit", async () => {
    let inFlight = 0;
    let peak = 0;
    await runWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8], 3, async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 10));
      inFlight--;
    });
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(0);
  });

  it("re-throws the first error after all workers settle", async () => {
    const completed: number[] = [];
    await expect(
      runWithConcurrency([1, 2, 3, 4], 2, async (n) => {
        await new Promise((r) => setTimeout(r, 5));
        if (n === 2) throw new Error("boom");
        completed.push(n);
      }),
    ).rejects.toThrow("boom");
    // Other tasks still ran to completion
    expect(completed).toContain(1);
    expect(completed).toContain(3);
    expect(completed).toContain(4);
  });

  it("rejects a non-positive limit", async () => {
    await expect(runWithConcurrency([1], 0, async (n) => n)).rejects.toThrow();
  });

  it("handles an empty input", async () => {
    const result = await runWithConcurrency<number, number>([], 3, async (n) => n);
    expect(result).toEqual([]);
  });
});
