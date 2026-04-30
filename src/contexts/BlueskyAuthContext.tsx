import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { BrowserOAuthClient, type OAuthSession } from "@atproto/oauth-client-browser";
import { Agent } from "@atproto/api";
import { toast } from "sonner";
import { ERROR_MESSAGES, AppError, ErrorType, getErrorMessage, logError } from "@/lib/error-messages";

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

/**
 * AT Protocol OAuth requires the `client_id` URL to exactly match the URL
 * the metadata document is served from. We pin all production hosts
 * (blutag.app, www.blutag.app, *.lovable.app previews) to the canonical
 * `https://blutag.app/oauth/client-metadata.json` so OAuth always works
 * regardless of which alias the user visits — the callback then lands on
 * the canonical domain. For local development we fall back to the current
 * origin (atproto's BrowserOAuthClient allows http://localhost in dev mode).
 */
const CANONICAL_CLIENT_ID = "https://blutag.app/oauth/client-metadata.json";
const isLocalhost =
  typeof window !== "undefined" &&
  /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
const CLIENT_ID = isLocalhost
  ? `${window.location.origin}/oauth/client-metadata.json`
  : CANONICAL_CLIENT_ID;

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

  const establishSession = useCallback(async (oauthSession: OAuthSession) => {
    try {
      const newAgent = new Agent(oauthSession);
      setAgent(newAgent);
      setDid(oauthSession.did);

      // Resolve handle from profile
      try {
        const profile = await newAgent.getProfile({ actor: oauthSession.did });
        setHandle(profile.data.handle);
      } catch (profileError) {
        // Fallback to DID if profile fetch fails (non-critical)
        logError(profileError, { context: "profile_fetch", did: oauthSession.did });
        setHandle(oauthSession.did);
      }
    } catch (error) {
      logError(error, { context: "establish_session" });
      throw new AppError(
        ERROR_MESSAGES.AUTH_FAILED,
        ErrorType.AUTHENTICATION,
        error
      );
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

          toast.success("Signed in to Bluesky");
        }
      } catch (err) {
        logError(err, { context: "oauth_init" });
        // Don't show error toast on init - user might not be trying to sign in
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [establishSession]);

  const signIn = useCallback(async (inputHandle: string) => {
    try {
      const client = await getClient();
      await client.signIn(inputHandle, {
        state: "login",
      });
      // Redirects to Bluesky — execution stops here
    } catch (err) {
      logError(err, { context: "oauth_signin", handle: inputHandle });
      
      const errorMessage = err instanceof Error ? err.message : String(err);
      let message: string;
      
      if (errorMessage.includes("client_metadata")) {
        message = ERROR_MESSAGES.AUTH_CLIENT_METADATA_ERROR;
      } else if (errorMessage.includes("resolve")) {
        message = ERROR_MESSAGES.AUTH_INVALID_HANDLE(inputHandle);
      } else {
        message = getErrorMessage(err);
      }
      
      throw new AppError(message, ErrorType.AUTHENTICATION, err);
    }
  }, []);

  const logout = useCallback(async () => {
    if (did) {
      try {
        const client = await getClient();
        await client.revoke(did);
      } catch (err) {
        logError(err, { context: "oauth_revoke", did });
        // Don't throw - logout should always succeed locally even if revoke fails
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
