import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addRecentLanguage,
  getActiveLanguage,
  getRecentLanguages,
  setActiveLanguage,
} from "./language-preference";

const LAST_KEY = "blutag.lang.last";
const RECENT_KEY = "blutag.lang.recent";

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getActiveLanguage / setActiveLanguage", () => {
  it("defaults to English when nothing is stored", () => {
    expect(getActiveLanguage()).toBe("en");
  });

  it("round-trips a normalized code", () => {
    setActiveLanguage("pt-BR");
    expect(localStorage.getItem(LAST_KEY)).toBe("pt");
    expect(getActiveLanguage()).toBe("pt");
  });

  it("ignores an invalid stored value", () => {
    localStorage.setItem(LAST_KEY, "not a code");
    expect(getActiveLanguage()).toBe("en");
  });

  it("falls back to English when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(getActiveLanguage()).toBe("en");
  });

  it("does not throw when storage writes fail", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => setActiveLanguage("hu")).not.toThrow();
  });
});

describe("getRecentLanguages", () => {
  it("returns an empty list when nothing is stored", () => {
    expect(getRecentLanguages()).toEqual([]);
  });

  it("returns an empty list for malformed JSON", () => {
    localStorage.setItem(RECENT_KEY, "{not json");
    expect(getRecentLanguages()).toEqual([]);
  });

  it("returns an empty list when the stored value is not an array", () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify({ hu: true }));
    expect(getRecentLanguages()).toEqual([]);
  });

  it("filters invalid entries and caps the list at three", () => {
    localStorage.setItem(RECENT_KEY, JSON.stringify(["hu", 1, "bad code", "sv", "de", "fr"]));
    expect(getRecentLanguages()).toEqual(["hu", "sv", "de"]);
  });
});

describe("addRecentLanguage", () => {
  it("puts the newest language first", () => {
    addRecentLanguage("hu");
    expect(addRecentLanguage("sv")).toEqual(["sv", "hu"]);
  });

  it("moves an existing language to the front instead of duplicating it", () => {
    addRecentLanguage("hu");
    addRecentLanguage("sv");
    expect(addRecentLanguage("hu")).toEqual(["hu", "sv"]);
  });

  it("keeps at most three recent languages", () => {
    ["hu", "sv", "de"].forEach(addRecentLanguage);
    expect(addRecentLanguage("fr")).toEqual(["fr", "de", "sv"]);
    expect(getRecentLanguages()).toEqual(["fr", "de", "sv"]);
  });
});
