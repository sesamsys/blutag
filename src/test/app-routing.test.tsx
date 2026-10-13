import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { Route as OAuthCallbackRoute } from "@/routes/oauth/callback";

function makeRouter() {
  return createRouter({ routeTree, context: { queryClient: new QueryClient() } });
}

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches the home page for /", () => {
    const matches = makeRouter().matchRoutes("/");
    expect(matches.at(-1)?.routeId).toBe("/");
  });

  it("matches the Bluesky OAuth return URL", () => {
    const matches = makeRouter().matchRoutes("/oauth/callback");
    expect(matches.at(-1)?.routeId).toBe("/oauth/callback");
  });

  it("matches the OAuth return URL with callback query parameters", () => {
    const matches = makeRouter().matchRoutes("/oauth/callback", {
      code: "abc",
      state: "xyz",
      iss: "bsky",
    });
    expect(matches.at(-1)?.routeId).toBe("/oauth/callback");
  });

  it("falls back to the root (not-found) for unknown URLs", () => {
    const matches = makeRouter().matchRoutes("/does-not-exist");
    expect(matches.at(-1)?.routeId).toBe(rootRouteId);
  });

  it("never server-renders the OAuth callback (tokens live in IndexedDB)", () => {
    expect(OAuthCallbackRoute.options.ssr).toBe(false);
  });
});
