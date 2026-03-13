import { Loader2 } from "lucide-react";

/**
 * OAuth callback landing page.
 * BrowserOAuthClient.init() (called in BlueskyAuthContext) automatically
 * detects the callback parameters in the URL and processes the OAuth exchange.
 * This page just shows a loading state while that happens.
 */
export default function OAuthCallback() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin" />
        <p className="text-sm font-medium">Completing sign in…</p>
      </div>
    </div>
  );
}
