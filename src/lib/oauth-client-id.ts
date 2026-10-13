/**
 * AT Protocol OAuth requires the `client_id` URL to exactly match the URL the
 * metadata document is served from. All hosted origins (blutag.app,
 * www.blutag.app, *.lovable.app previews) are pinned to the canonical
 * document so OAuth works on every alias; the callback then lands on the
 * canonical domain.
 */
export const CANONICAL_CLIENT_ID = "https://blutag.app/oauth/client-metadata.json";

/** Scope Blutag needs to create posts and upload images. */
export const OAUTH_SCOPE = "atproto transition:generic";

const OAUTH_CALLBACK_PATH = "/oauth/callback";
const LOOPBACK_HOST_PATTERN = /^(localhost|127\.0\.0\.1|\[::1\])$/;

interface LocationLike {
  hostname: string;
  port: string;
}

export function isLoopbackHost(hostname: string): boolean {
  return LOOPBACK_HOST_PATTERN.test(hostname);
}

/**
 * Returns the OAuth `client_id` for the given location.
 *
 * Local development can't serve a public metadata document, so it uses the
 * spec's virtual loopback client: `http://localhost` with **no path** (a path
 * is rejected as "Invalid loopback client ID") and the redirect URI and scope
 * passed as query parameters. Loopback redirect URIs must use an IP literal,
 * so `localhost` is rewritten to `127.0.0.1`.
 */
export function getOAuthClientId(location: LocationLike): string {
  if (!isLoopbackHost(location.hostname)) return CANONICAL_CLIENT_ID;

  const host = location.hostname === "localhost" ? "127.0.0.1" : location.hostname;
  const port = location.port ? `:${location.port}` : "";
  const params = new URLSearchParams({
    redirect_uri: `http://${host}${port}${OAUTH_CALLBACK_PATH}`,
    scope: OAUTH_SCOPE,
  });
  return `http://localhost?${params.toString()}`;
}

/**
 * Returns the same URL on `127.0.0.1` when visited on `localhost`, or `null`
 * when no move is needed. The OAuth client refuses to run on `localhost`.
 */
export function getLoopbackIpUrl(href: string): string | null {
  const url = new URL(href);
  if (url.hostname !== "localhost") return null;
  url.hostname = "127.0.0.1";
  return url.toString();
}

/**
 * Inline copy of `public/oauth/client-metadata.json`, used on hosted aliases
 * that can't fetch the canonical document cross-origin.
 */
export const CANONICAL_CLIENT_METADATA = {
  client_id: CANONICAL_CLIENT_ID,
  application_type: "web",
  client_name: "Blutag",
  client_uri: "https://blutag.app",
  dpop_bound_access_tokens: true,
  grant_types: ["authorization_code", "refresh_token"],
  response_types: ["code"],
  redirect_uris: ["https://blutag.app/oauth/callback"],
  scope: OAUTH_SCOPE,
  token_endpoint_auth_method: "none",
} as const;
