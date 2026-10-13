import { supabase } from "@/integrations/supabase/client";
import { AppError, ERROR_MESSAGES, ErrorType } from "@/lib/error-messages";
import type { ExifInfo } from "@/types/photo";

export interface AltTextRequest {
  imageBase64: string;
  exifData: ExifInfo;
  language: string;
}

function hasAltText(value: unknown): value is { altText: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "altText" in value &&
    typeof value.altText === "string"
  );
}

/**
 * Calls the `analyze-photo` backend function once and returns the alt text.
 * Maps rate-limit (429) and quota (402) failures to typed `AppError`s; quota
 * errors are marked non-retryable so `retryWithTimeout` stops immediately.
 */
export async function requestAltText(request: AltTextRequest): Promise<string> {
  const { data, error } = await supabase.functions.invoke("analyze-photo", { body: request });

  if (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes("429")) {
      throw new AppError(ERROR_MESSAGES.ALT_TEXT_RATE_LIMIT, ErrorType.RATE_LIMIT, error);
    }
    if (message.includes("402")) {
      throw new AppError(ERROR_MESSAGES.ALT_TEXT_QUOTA_EXCEEDED, ErrorType.QUOTA, error, false);
    }
    throw error;
  }

  if (!hasAltText(data)) {
    throw new AppError(ERROR_MESSAGES.ALT_TEXT_GENERATION_FAILED, ErrorType.SERVICE, data);
  }
  return data.altText;
}
