import { describe, expect, it } from "vitest";
  CANONICAL_CLIENT_METADATA,
  CANONICAL_CLIENT_ID,
  OAUTH_SCOPE,
  getLoopbackIpUrl,
  getOAuthClientId,
  isLoopbackHost,
} from "./oauth-client-id";

describe("isLoopbackHost", () => {
  it.each(["localhost", "127.0.0.1", "[::1]"])("treats %s as loopback", (host) => {
    expect(isLoopbackHost(host)).toBe(true);
  });

  it.each(["blutag.app", "www.blutag.app", "blutag.lovable.app", "localhost.evil.com"])(
    "treats %s as hosted",
    (host) => {
      expect(isLoopbackHost(host)).toBe(false);
    },
  );
});

describe("getOAuthClientId", () => {
  it("uses the canonical metadata document on hosted origins", () => {
    expect(getOAuthClientId({ hostname: "www.blutag.app", port: "" })).toBe(CANONICAL_CLIENT_ID);
    expect(getOAuthClientId({ hostname: "blutag.lovable.app", port: "" })).toBe(
      CANONICAL_CLIENT_ID,
    );
  });

  // Regression: a path on the loopback client ID made local sign-in fail with
  // "Invalid loopback client ID: Value must not contain a path component".
  it("builds a path-less loopback client ID for localhost", () => {
    const id = new URL(getOAuthClientId({ hostname: "localhost", port: "8080" }));

    expect(id.origin).toBe("http://localhost");
    expect(id.pathname).toBe("/");
    expect(getOAuthClientId({ hostname: "localhost", port: "8080" })).not.toContain("localhost/");
    expect(id.searchParams.get("redirect_uri")).toBe("http://127.0.0.1:8080/oauth/callback");
    expect(id.searchParams.get("scope")).toBe(OAUTH_SCOPE);
  });

  it("keeps an IP loopback host and omits an empty port", () => {
    const id = new URL(getOAuthClientId({ hostname: "127.0.0.1", port: "" }));
    expect(id.searchParams.get("redirect_uri")).toBe("http://127.0.0.1/oauth/callback");
  });
});

describe("getLoopbackIpUrl", () => {
  it("moves localhost to 127.0.0.1, keeping port, path and query", () => {
    expect(getLoopbackIpUrl("http://localhost:8080/oauth/callback?code=a")).toBe(
      "http://127.0.0.1:8080/oauth/callback?code=a",
    );
  });

  it("leaves other hosts alone", () => {
    expect(getLoopbackIpUrl("http://127.0.0.1:8080/")).toBeNull();
    expect(getLoopbackIpUrl("https://blutag.app/")).toBeNull();
  });
});

describe("sign-in on preview shows 'Load failed'", () => {
  it("inline metadata matches the published client metadata document", async () => {
    const { readFileSync } = await import("node:fs");
    const published: unknown = JSON.parse(
      readFileSync("public/oauth/client-metadata.json", "utf8"),
    );
    expect(CANONICAL_CLIENT_METADATA).toEqual(published);
  });
});
