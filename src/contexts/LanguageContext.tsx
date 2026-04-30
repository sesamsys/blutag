import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addRecentLanguage,
  getActiveLanguage,
  getRecentLanguages,
  setActiveLanguage as persistActiveLanguage,
} from "@/lib/language-preference";
import { isValidLangCode, normalizeLangCode } from "@/lib/languages";
import { useBlueskyAuth } from "./BlueskyAuthContext";
import { logError } from "@/lib/error-messages";

interface LanguageContextValue {
  language: string;
  setLanguage: (code: string) => void;
  recent: string[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(() => getActiveLanguage());
  const [recent, setRecent] = useState<string[]>(() => getRecentLanguages());
  const userTouchedRef = useRef(false);
  const lastDidRef = useRef<string | null>(null);

  const { agent, did } = useBlueskyAuth();

  const setLanguage = useCallback((code: string) => {
    const normalized = normalizeLangCode(code);
    userTouchedRef.current = true;
    setLanguageState(normalized);
    persistActiveLanguage(normalized);
    setRecent(addRecentLanguage(normalized));
  }, []);

  // When a Bluesky session becomes available, attempt to read post language preferences
  // and use the first as a hint — but only if the user hasn't manually picked yet
  // for the current session/account.
  useEffect(() => {
    if (!agent || !did) {
      lastDidRef.current = null;
      return;
    }
    // Avoid re-running for the same session
    if (lastDidRef.current === did) return;
    lastDidRef.current = did;

    if (userTouchedRef.current) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await agent.app.bsky.actor.getPreferences();
        const prefs = res.data.preferences as Array<Record<string, unknown>>;
        const langPref = prefs.find(
          (p) => p?.$type === "app.bsky.actor.defs#postLanguagesPref"
        );
        const codes = (langPref?.languages as string[] | undefined) ?? [];
        const valid = codes.filter((c) => isValidLangCode(c)).map(normalizeLangCode);
        if (cancelled || valid.length === 0) return;

        // Set the first as active (only because user hasn't touched it)
        if (!userTouchedRef.current) {
          setLanguageState(valid[0]);
          persistActiveLanguage(valid[0]);
          // Merge all into recents
          let merged = getRecentLanguages();
          for (const code of [...valid].reverse()) {
            merged = addRecentLanguage(code);
          }
          setRecent(merged);
        }
      } catch (err) {
        logError(err, { context: "bluesky_lang_pref_fetch" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [agent, did]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, recent }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
