import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppError, ERROR_MESSAGES, ErrorType } from "./error-messages";
import { retryWithTimeout } from "./retry";
import { requestAltText } from "./analyze-photo";
import { mockInvoke } from "@/test/mocks/supabaseClient";

vi.mock("@/integrations/supabase/client", () => import("@/test/mocks/supabaseClient"));

const REQUEST = { imageBase64: "abc", exifData: {}, language: "hu" };

beforeEach(() => {
  mockInvoke.mockReset();
});

describe("requestAltText", () => {
  it("sends the image, EXIF data and language to analyze-photo", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { altText: "A red car" }, error: null });

    await expect(requestAltText(REQUEST)).resolves.toBe("A red car");
    expect(mockInvoke).toHaveBeenCalledWith("analyze-photo", { body: REQUEST });
  });

  it("maps a 429 response to a retryable rate-limit error", async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: new Error("status 429") });

    const error = await requestAltText(REQUEST).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({
      message: ERROR_MESSAGES.ALT_TEXT_RATE_LIMIT,
      type: ErrorType.RATE_LIMIT,
      retryable: true,
    });
  });

  it("maps a 402 response to a non-retryable quota error", async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: new Error("status 402") });

    await expect(requestAltText(REQUEST)).rejects.toMatchObject({
      message: ERROR_MESSAGES.ALT_TEXT_QUOTA_EXCEEDED,
      type: ErrorType.QUOTA,
      retryable: false,
    });
  });

  it("rethrows other backend errors unchanged", async () => {
    const backendError = new Error("Edge function returned 500");
    mockInvoke.mockResolvedValueOnce({ data: null, error: backendError });

    await expect(requestAltText(REQUEST)).rejects.toBe(backendError);
  });

  it("handles non-Error error values", async () => {
    mockInvoke.mockResolvedValueOnce({ data: null, error: "429 Too Many Requests" });

    await expect(requestAltText(REQUEST)).rejects.toMatchObject({ type: ErrorType.RATE_LIMIT });
  });

  it("rejects a response without alt text", async () => {
    mockInvoke.mockResolvedValueOnce({ data: { something: "else" }, error: null });

    await expect(requestAltText(REQUEST)).rejects.toMatchObject({
      message: ERROR_MESSAGES.ALT_TEXT_GENERATION_FAILED,
      type: ErrorType.SERVICE,
    });
  });

  describe("with retryWithTimeout (as used by the home page)", () => {
    it("stops after the first attempt on a quota error", async () => {
      mockInvoke.mockResolvedValue({ data: null, error: new Error("402") });

      await expect(
        retryWithTimeout(() => requestAltText(REQUEST), 1_000, {
          maxAttempts: 3,
          initialDelay: 1,
        }),
      ).rejects.toMatchObject({ type: ErrorType.QUOTA });
      expect(mockInvoke).toHaveBeenCalledTimes(1);
    });

    it("retries a rate-limit error and succeeds", async () => {
      vi.useFakeTimers();
      try {
        mockInvoke
          .mockResolvedValueOnce({ data: null, error: new Error("429") })
          .mockResolvedValueOnce({ data: { altText: "A cat" }, error: null });

        const promise = retryWithTimeout(() => requestAltText(REQUEST), 1_000, {
          maxAttempts: 3,
          initialDelay: 10,
        });
        await vi.advanceTimersByTimeAsync(50);

        await expect(promise).resolves.toBe("A cat");
        expect(mockInvoke).toHaveBeenCalledTimes(2);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
