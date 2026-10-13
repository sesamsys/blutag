import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BlueskyAuthProvider, useBlueskyAuth } from "./BlueskyAuthContext";
import { ERROR_MESSAGES } from "@/lib/error-messages";

const oauthClient = {
  init: vi.fn(),
  signIn: vi.fn(),
  revoke: vi.fn(),
};

vi.mock("@atproto/oauth-client-browser", () => ({
  BrowserOAuthClient: { load: vi.fn(async () => oauthClient) },
}));

const getProfile = vi.fn();
vi.mock("@atproto/api", () => ({
  Agent: class {
    getProfile = getProfile;
  },
}));

const navigate = vi.fn();
const routerState = { location: { pathname: "/" } };
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ navigate, state: routerState }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

function wrapper({ children }: { children: ReactNode }) {
  return <BlueskyAuthProvider>{children}</BlueskyAuthProvider>;
}

const session = { did: "did:plc:alice" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
  routerState.location.pathname = "/";
  oauthClient.init.mockResolvedValue(undefined);
  getProfile.mockResolvedValue({ data: { handle: "alice.bsky.social" } });
});

describe("BlueskyAuthProvider", () => {
  it("is signed out after init when there is no session", async () => {
    const { result } = renderHook(() => useBlueskyAuth(), { wrapper });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.agent).toBeNull();
  });

  it("restores an existing session with the profile handle", async () => {
    oauthClient.init.mockResolvedValue({ session });

    const { result } = renderHook(() => useBlueskyAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoggedIn).toBe(true));
    expect(result.current.handle).toBe("alice.bsky.social");
    expect(result.current.did).toBe("did:plc:alice");
    expect(navigate).not.toHaveBeenCalled();
  });

  it("falls back to the DID when the profile can't be loaded", async () => {
    oauthClient.init.mockResolvedValue({ session });
    getProfile.mockRejectedValue(new Error("profile down"));

    const { result } = renderHook(() => useBlueskyAuth(), { wrapper });

    await waitFor(() => expect(result.current.handle).toBe("did:plc:alice"));
  });

  it("returns to the home page after completing an OAuth callback", async () => {
    routerState.location.pathname = "/oauth/callback";
    oauthClient.init.mockResolvedValue({ session, state: "login" });

    const { result } = renderHook(() => useBlueskyAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoggedIn).toBe(true));
    expect(navigate).toHaveBeenCalledWith({ to: "/", replace: true });
  });

  it("stays signed out when init fails", async () => {
    oauthClient.init.mockRejectedValue(new Error("IndexedDB unavailable"));

    const { result } = renderHook(() => useBlueskyAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLoggedIn).toBe(false);
  });

  it("signs out locally even when token revocation fails", async () => {
    oauthClient.init.mockResolvedValue({ session });
    oauthClient.revoke.mockRejectedValue(new Error("network"));

    const { result } = renderHook(() => useBlueskyAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoggedIn).toBe(true));

    await act(async () => {
      await result.current.logout();
    });

    expect(oauthClient.revoke).toHaveBeenCalledWith("did:plc:alice");
    expect(result.current.isLoggedIn).toBe(false);
    expect(result.current.handle).toBeNull();
    expect(result.current.did).toBeNull();
  });

  describe("signIn", () => {
    it("starts the OAuth redirect for the handle", async () => {
      oauthClient.signIn.mockResolvedValue(undefined);
      const { result } = renderHook(() => useBlueskyAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await act(async () => {
        await result.current.signIn("alice.bsky.social");
      });

      expect(oauthClient.signIn).toHaveBeenCalledWith("alice.bsky.social", { state: "login" });
    });

    it("explains client metadata problems", async () => {
      oauthClient.signIn.mockRejectedValue(new Error("invalid client_metadata"));
      const { result } = renderHook(() => useBlueskyAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(result.current.signIn("alice.bsky.social")).rejects.toThrow(
        ERROR_MESSAGES.AUTH_CLIENT_METADATA_ERROR,
      );
    });

    it("explains handles that can't be resolved", async () => {
      oauthClient.signIn.mockRejectedValue(new Error("Failed to resolve identity"));
      const { result } = renderHook(() => useBlueskyAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(result.current.signIn("nobody.example")).rejects.toThrow(
        ERROR_MESSAGES.AUTH_INVALID_HANDLE("nobody.example"),
      );
    });

    it("falls back to a generic message for other failures", async () => {
      oauthClient.signIn.mockRejectedValue("boom");
      const { result } = renderHook(() => useBlueskyAuth(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      await expect(result.current.signIn("alice.bsky.social")).rejects.toMatchObject({
        name: "AppError",
      });
    });
  });

  it("throws when used outside the provider", () => {
    expect(() => renderHook(() => useBlueskyAuth())).toThrow(/within BlueskyAuthProvider/);
  });
});
