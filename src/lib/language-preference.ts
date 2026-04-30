import { isValidLangCode, normalizeLangCode } from "./languages";

const LAST_KEY = "blutag.lang.last";
const RECENT_KEY = "blutag.lang.recent";
const RECENT_MAX = 3;

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore quota / privacy mode errors */
  }
}

export function getActiveLanguage(): string {
  const stored = safeGet(LAST_KEY);
  if (stored && isValidLangCode(stored)) return normalizeLangCode(stored);
  return "en";
}

export function setActiveLanguage(code: string) {
  const normalized = normalizeLangCode(code);
  safeSet(LAST_KEY, normalized);
}

export function getRecentLanguages(): string[] {
  const raw = safeGet(RECENT_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((c): c is string => typeof c === "string" && isValidLangCode(c))
      .map(normalizeLangCode)
      .slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

export function addRecentLanguage(code: string): string[] {
  const normalized = normalizeLangCode(code);
  const current = getRecentLanguages().filter((c) => c !== normalized);
  const next = [normalized, ...current].slice(0, RECENT_MAX);
  safeSet(RECENT_KEY, JSON.stringify(next));
  return next;
}
