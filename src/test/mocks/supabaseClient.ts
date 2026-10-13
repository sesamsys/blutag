import { vi } from "vitest";

/**
 * Shared mock of the backend client. Use with:
 *
 * ```ts
 * vi.mock("@/integrations/supabase/client", () => import("@/test/mocks/supabaseClient"));
 * import { mockInvoke } from "@/test/mocks/supabaseClient";
 * mockInvoke.mockResolvedValueOnce({ data: { altText: "A dog" }, error: null });
 * ```
 */
export const mockInvoke = vi.fn<
  (name: string, options?: { body?: unknown }) => Promise<{ data: unknown; error: unknown }>
>(async () => ({ data: null, error: null }));

export const supabase = {
  functions: { invoke: mockInvoke },
};
