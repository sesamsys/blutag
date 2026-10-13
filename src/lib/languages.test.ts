import { describe, expect, it } from "vitest";
import {
  ALL_LANGUAGES,
  CURATED_LANGUAGES,
  DEFAULT_LANGUAGE,
  extractPostLanguages,
  getLanguage,
  getLanguageName,
  isValidLangCode,
  normalizeLangCode,
} from "./languages";

describe("isValidLangCode", () => {
  it.each(["en", "fil", "pt-BR"])("accepts %s", (code) => {
    expect(isValidLangCode(code)).toBe(true);
  });

  it.each([null, undefined, "", "e", "english", "pt-br", "EN"])("rejects %s", (code) => {
    expect(isValidLangCode(code)).toBe(false);
  });
});

describe("normalizeLangCode", () => {
  it("reduces region codes to the primary subtag", () => {
    expect(normalizeLangCode("pt-BR")).toBe("pt");
  });

  it("lowercases and trims", () => {
    expect(normalizeLangCode("  HU ")).toBe("hu");
  });

  it("falls back to the default for empty input", () => {
    expect(normalizeLangCode(null)).toBe(DEFAULT_LANGUAGE);
    expect(normalizeLangCode("")).toBe(DEFAULT_LANGUAGE);
  });

  it("falls back to the default when only a separator is given", () => {
    expect(normalizeLangCode("-")).toBe(DEFAULT_LANGUAGE);
  });

  it("falls back to the default for unknown languages", () => {
    expect(normalizeLangCode("xx")).toBe(DEFAULT_LANGUAGE);
  });
});

describe("getLanguage / getLanguageName", () => {
  it("returns the matching language", () => {
    expect(getLanguage("hu").nameEn).toBe("Hungarian");
  });

  it("falls back to English for unknown codes", () => {
    expect(getLanguage("zz").code).toBe(DEFAULT_LANGUAGE);
    expect(getLanguageName("zz")).toBe("English");
  });
});

describe("language lists", () => {
  it("has unique codes in the full list", () => {
    const codes = ALL_LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("only curates languages that exist in the full list", () => {
    const all = new Set(ALL_LANGUAGES.map((l) => l.code));
    for (const lang of CURATED_LANGUAGES) expect(all.has(lang.code)).toBe(true);
  });
});

describe("extractPostLanguages", () => {
  const pref = (languages: unknown) => ({
    $type: "app.bsky.actor.defs#postLanguagesPref",
    languages,
  });

  it("returns normalized valid codes in order", () => {
    expect(extractPostLanguages([pref(["hu", "pt-BR", "en"])])).toEqual(["hu", "pt", "en"]);
  });

  it("drops invalid and non-string entries", () => {
    expect(extractPostLanguages([pref(["hu", 42, "english", null])])).toEqual(["hu"]);
  });

  it("returns an empty list when the preference is missing", () => {
    expect(extractPostLanguages([{ $type: "app.bsky.actor.defs#adultContentPref" }])).toEqual([]);
  });

  it("returns an empty list when languages is not an array", () => {
    expect(extractPostLanguages([pref("hu")])).toEqual([]);
  });

  it("ignores non-object entries", () => {
    expect(extractPostLanguages([null, "x", 3, pref(["sv"])])).toEqual(["sv"]);
  });
});
