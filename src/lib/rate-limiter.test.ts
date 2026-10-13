import { describe, it, expect } from "vitest";
import { createRateLimiter } from "./rate-limiter";

describe("createRateLimiter", () => {
  it("allows calls up to maxCalls", () => {
    const limiter = createRateLimiter({ maxCalls: 3, windowMs: 1000 }, () => 0);
    expect(limiter.canProceed()).toBe(true);
    limiter.record();
    limiter.record();
    limiter.record();
    expect(limiter.canProceed()).toBe(false);
  });

  it("frees slots after the window expires", () => {
    let time = 0;
    const limiter = createRateLimiter({ maxCalls: 2, windowMs: 100 }, () => time);

    limiter.record(); // t=0
    time = 50;
    limiter.record(); // t=50
    expect(limiter.canProceed()).toBe(false);

    time = 101; // first call expired
    expect(limiter.canProceed()).toBe(true);
    expect(limiter.currentCount()).toBe(1);
  });

  it("returns correct msUntilNextSlot", () => {
    let time = 0;
    const limiter = createRateLimiter({ maxCalls: 1, windowMs: 1000 }, () => time);

    expect(limiter.msUntilNextSlot()).toBe(0);
    limiter.record(); // t=0
    time = 300;
    expect(limiter.msUntilNextSlot()).toBe(700);
    time = 1001;
    expect(limiter.msUntilNextSlot()).toBe(0);
  });

  it("resets all timestamps", () => {
    const limiter = createRateLimiter({ maxCalls: 1, windowMs: 1000 }, () => 0);
    limiter.record();
    expect(limiter.canProceed()).toBe(false);
    limiter.reset();
    expect(limiter.canProceed()).toBe(true);
    expect(limiter.currentCount()).toBe(0);
  });

  it("currentCount reflects active window only", () => {
    let time = 0;
    const limiter = createRateLimiter({ maxCalls: 10, windowMs: 100 }, () => time);

    limiter.record(); // t=0
    limiter.record(); // t=0
    expect(limiter.currentCount()).toBe(2);

    time = 200;
    expect(limiter.currentCount()).toBe(0);
  });
});
