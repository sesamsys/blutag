import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { BrowserOAuthClient } from "@atproto/oauth-client-browser";
import { Agent } from "@atproto/api";
import { toast } from "sonner";

interface BlueskyAuthContextValue {
  agent: Agent | null;
  handle: string | null;
  did: string | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  signIn: (handle: string) => Promise<void>;
  logout: () => void;
}

const BlueskyAuthContext = createContext<BlueskyAuthContextValue | null>(null);

const CLIENT_ID = `${window.location.origin}/oauth/client-metadata.json`;

let clientPromise: Promise<BrowserOAuthClient> | null = null;

function getClient(): Promise<BrowserOAuthClient> {
  if (!clientPromise) {
    clientPromise = BrowserOAuthClient.load({
      clientId: CLIENT_ID,
      handleResolver: "https://bsky.social",
    });
  }
  return clientPromise;
}

export function BlueskyAuthProvider({ children }: { children: ReactNode }) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [did, setDid] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const establishSession = useCallback(async (oauthSession: { did: string }) => {
    const newAgent = new Agent(oauthSession as any);
    setAgent(newAgent);
    setDid(oauthSession.did);

    // Resolve handle from profile
    try {
      const profile = await newAgent.getProfile({ actor: oauthSession.did });
      setHandle(profile.data.handle);
    } catch {
      // Fallback to DID if profile fetch fails
      setHandle(oauthSession.did);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const client = await getClient();
        const result = await client.init();

        if (!mounted) return;

        if (result?.session) {
          await establishSession(result.session);

          // If this was a callback (has state), redirect to home
          if (result.state != null && window.location.pathname !== "/") {
            window.history.replaceState(null, "", "/");
            window.dispatchEvent(new PopStateEvent("popstate"));
          }

          toast.success(`Signed in to Bluesky`);
        }
      } catch (err) {
        console.error("OAuth init failed:", err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [establishSession]);

  const signIn = useCallback(async (inputHandle: string) => {
    const client = await getClient();
    await client.signIn(inputHandle, {
      state: "login",
    });
    // Redirects to Bluesky — execution stops here
  }, []);

  const logout = useCallback(async () => {
    if (did) {
      try {
        const client = await getClient();
        await client.revoke(did);
      } catch (err) {
        console.error("Revoke failed:", err);
      }
    }
    setAgent(null);
    setHandle(null);
    setDid(null);
    toast.success("Signed out of Bluesky");
  }, [did]);

  return (
    <BlueskyAuthContext.Provider
      value={{
        agent,
        handle,
        did,
        isLoggedIn: !!agent,
        isLoading,
        signIn,
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
