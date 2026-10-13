import { describe, expect, it } from "vitest";
import { BLUESKY_POST_MAX_LENGTH, MAX_ALT_TEXT_LENGTH } from "./constants";
import { remainingPostCharacters, validatePostDraft } from "./post-validation";
import type { PhotoFile } from "@/types/photo";

function photo(altText: string | undefined): PhotoFile {
  return {
    id: "p1",
    file: new File(["x"], "p.jpg", { type: "image/jpeg" }),
    preview: "blob:p1",
    altText,
  };
}

describe("validatePostDraft", () => {
  it("accepts text at exactly the post limit with valid alt text", () => {
    expect(validatePostDraft("a".repeat(BLUESKY_POST_MAX_LENGTH), [photo("A dog")])).toBeNull();
  });

  it("rejects text one character over the post limit", () => {
    expect(validatePostDraft("a".repeat(BLUESKY_POST_MAX_LENGTH + 1), [photo("A dog")])).toBe(
      `Post text exceeds ${BLUESKY_POST_MAX_LENGTH} character limit`,
    );
  });

  it("rejects a draft with no photos", () => {
    expect(validatePostDraft("hello", [])).toBe("No photos with alt text to post");
  });

  it("rejects a photo without alt text", () => {
    expect(validatePostDraft("", [photo(undefined)])).toMatch(/must have alt text/);
  });

  it("rejects a photo with empty alt text", () => {
    expect(validatePostDraft("", [photo("")])).toMatch(/must have alt text/);
  });

  it("rejects alt text over the Bluesky limit", () => {
    expect(validatePostDraft("", [photo("a".repeat(MAX_ALT_TEXT_LENGTH + 1))])).toMatch(
      String(MAX_ALT_TEXT_LENGTH),
    );
  });

  it("checks the text length before the photos", () => {
    expect(validatePostDraft("a".repeat(BLUESKY_POST_MAX_LENGTH + 1), [])).toMatch(/exceeds/);
  });
});

describe("remainingPostCharacters", () => {
  it("counts down from the post limit", () => {
    expect(remainingPostCharacters("")).toBe(BLUESKY_POST_MAX_LENGTH);
    expect(remainingPostCharacters("hello")).toBe(BLUESKY_POST_MAX_LENGTH - 5);
  });

  it("goes negative when over the limit", () => {
    expect(remainingPostCharacters("a".repeat(BLUESKY_POST_MAX_LENGTH + 2))).toBe(-2);
  });
});
