import { describe, expect, it } from "vitest";
import { isValidHandle } from "./handle-validation";

describe("isValidHandle", () => {
  it.each(["alice.bsky.social", "sesam.hu", "a.b", "  bob.example.com  "])(
    "accepts %s",
    (handle) => {
      expect(isValidHandle(handle)).toBe(true);
    },
  );

  it("rejects handles shorter than 3 characters", () => {
    expect(isValidHandle("a.")).toBe(false);
  });

  it("rejects handles without a dot", () => {
    expect(isValidHandle("alice")).toBe(false);
  });

  it("rejects handles containing @", () => {
    expect(isValidHandle("@alice.bsky.social")).toBe(false);
  });

  it("rejects handles containing an inner space", () => {
    expect(isValidHandle("alice bsky.social")).toBe(false);
  });

  it("measures length after trimming whitespace", () => {
    expect(isValidHandle("   a.   ")).toBe(false);
  });
});
