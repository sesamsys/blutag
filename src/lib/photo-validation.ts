import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "@/lib/constants";

/** File extensions accepted for upload (lowercase, without the dot). */
export const ACCEPTED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "webp", "heic", "heif"];

/** Maximum number of individual rejection reasons listed in one message. */
const MAX_LISTED_REJECTIONS = 3;

export interface PhotoSelectionResult {
  /** Files that passed validation and fit in the remaining slots. */
  accepted: File[];
  /** One human-readable reason per rejected file. */
  rejections: string[];
  /** Valid files dropped because the photo limit was reached. */
  overflowCount: number;
}

/** Returns why a single file can't be uploaded, or null when it is acceptable. */
export function getFileRejectionReason(file: File): string | null {
  if (!file.type.startsWith("image/")) return `${file.name}: Not an image file`;
  if (file.size > MAX_FILE_SIZE_BYTES) return `${file.name}: Exceeds ${MAX_FILE_SIZE_MB}MB limit`;
  if (file.size === 0) return `${file.name}: File is empty`;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!ext || !ACCEPTED_IMAGE_EXTENSIONS.includes(ext)) {
    return `${file.name}: Unsupported file type`;
  }
  return null;
}

/**
 * Splits a user's file selection into accepted files, per-file rejection
 * reasons and the number of valid files that didn't fit in `remainingSlots`.
 */
export function selectPhotos(files: readonly File[], remainingSlots: number): PhotoSelectionResult {
  const valid: File[] = [];
  const rejections: string[] = [];
  for (const file of files) {
    const reason = getFileRejectionReason(file);
    if (reason) rejections.push(reason);
    else valid.push(file);
  }
  const slots = Math.max(0, remainingSlots);
  return {
    accepted: valid.slice(0, slots),
    rejections,
    overflowCount: Math.max(0, valid.length - slots),
  };
}

/** Formats rejection reasons into one toast message, listing at most three. */
export function formatRejections(rejections: readonly string[]): string {
  const listed = rejections.slice(0, MAX_LISTED_REJECTIONS).join("\n");
  const more = rejections.length - MAX_LISTED_REJECTIONS;
  return `Some files were rejected:\n${listed}${more > 0 ? `\n...and ${more} more` : ""}`;
}
