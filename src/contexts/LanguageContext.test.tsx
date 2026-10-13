import type { ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, useLanguage } from "./LanguageContext";

interface FakeAuth {
  agent: { app: { bsky: { actor: { getPreferences: ReturnType<typeof vi.fn> } } } } | null;
  did: string | null;
}

const auth: FakeAuth = { agent: null, did: null };

vi.mock("./BlueskyAuthContext", () => ({
  useBlueskyAuth: () => auth,
}));

function wrapper({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

function agentWithLanguages(languages: unknown) {
  return {
    app: {
      bsky: {
        actor: {
          getPreferences: vi.fn(async () => ({
            data: {
              preferences: [{ $type: "app.bsky.actor.defs#postLanguagesPref", languages }],
            },
          })),
        },
      },
    },
  };
}

beforeEach(() => {
  localStorage.clear();
  auth.agent = null;
  auth.did = null;
});

describe("LanguageProvider", () => {
  it("defaults to English with no recents", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe("en");
    expect(result.current.recent).toEqual([]);
  });

  it("loads the stored language and recents after mounting", async () => {
    localStorage.setItem("blutag.lang.last", "hu");
    localStorage.setItem("blutag.lang.recent", JSON.stringify(["hu", "sv"]));

    const { result } = renderHook(() => useLanguage(), { wrapper });

    await waitFor(() => expect(result.current.language).toBe("hu"));
    expect(result.current.recent).toEqual(["hu", "sv"]);
  });

  it("persists a picked language and moves it to the front of recents", () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => result.current.setLanguage("sv"));
    act(() => result.current.setLanguage("pt-BR"));

    expect(result.current.language).toBe("pt");
    expect(result.current.recent).toEqual(["pt", "sv"]);
    expect(localStorage.getItem("blutag.lang.last")).toBe("pt");
  });

  it("adopts the first Bluesky post language when the user hasn't picked one", async () => {
    auth.agent = agentWithLanguages(["de", "fr"]);
    auth.did = "did:plc:alice";

    const { result } = renderHook(() => useLanguage(), { wrapper });

    await waitFor(() => expect(result.current.language).toBe("de"));
    expect(result.current.recent).toEqual(["de", "fr"]);
  });

  it("keeps the user's manual choice over Bluesky preferences", async () => {
    const { result, rerender } = renderHook(() => useLanguage(), { wrapper });
    act(() => result.current.setLanguage("hu"));

    const agent = agentWithLanguages(["de"]);
    auth.agent = agent;
    auth.did = "did:plc:alice";
    rerender();

    await waitFor(() => expect(result.current.language).toBe("hu"));
    expect(agent.app.bsky.actor.getPreferences).not.toHaveBeenCalled();
  });

  it("keeps the current language when preferences can't be loaded", async () => {
    const agent = agentWithLanguages([]);
    agent.app.bsky.actor.getPreferences.mockRejectedValueOnce(new Error("offline"));
    auth.agent = agent;
    auth.did = "did:plc:alice";
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { result } = renderHook(() => useLanguage(), { wrapper });

    await waitFor(() => expect(agent.app.bsky.actor.getPreferences).toHaveBeenCalled());
    expect(result.current.language).toBe("en");
  });

  it("throws when used outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => renderHook(() => useLanguage())).toThrow(/within LanguageProvider/);
  });
});
