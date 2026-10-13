import { createFileRoute } from "@tanstack/react-router";
import OAuthCallback from "@/pages/OAuthCallback";

/**
 * Bluesky OAuth return URL. Browser-only: the OAuth client reads the callback
 * parameters and stores DPoP-bound tokens in IndexedDB, neither of which
 * exists during server rendering.
 */
export const Route = createFileRoute("/oauth/callback")({
  ssr: false,
  component: OAuthCallback,
});
