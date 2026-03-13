import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlueskySession {
  handle: string;
  did: string;
  accessJwt: string;
  refreshJwt: string;
}

interface BlueskyAuthContextValue {
  session: BlueskySession | null;
  isLoggedIn: boolean;
  isLoggingIn: boolean;
  login: (identifier: string, appPassword: string) => Promise<void>;
  logout: () => void;
}

const BlueskyAuthContext = createContext<BlueskyAuthContextValue | null>(null);

const SESSION_KEY = "blutag_bsky_session";

export function BlueskyAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<BlueskySession | null>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (session) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  const login = useCallback(async (identifier: string, appPassword: string) => {
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.functions.invoke("bsky-login", {
        body: { identifier, password: appPassword },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setSession({
        handle: data.handle,
        did: data.did,
        accessJwt: data.accessJwt,
        refreshJwt: data.refreshJwt,
      });
      toast.success(`Logged in as @${data.handle}`);
    } catch (err) {
      console.error("Bluesky login failed:", err);
      const message = err instanceof Error ? err.message : "Login failed";
      toast.error(message);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    toast.success("Logged out of Bluesky");
  }, []);

  return (
    <BlueskyAuthContext.Provider
      value={{
        session,
        isLoggedIn: !!session,
        isLoggingIn,
        login,
        logout,
      }}
    >
      {children}
    </BlueskyAuthContext.Provider>
  );
}

export function useBlueskyAuth() {
  const ctx = useContext(BlueskyAuthContext);
  if (!ctx) throw new Error("useBlueskyAuth must be used within BlueskyAuthProvider");
  return ctx;
}
