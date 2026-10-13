/** Shortest handle accepted by the sign-in form (e.g. "a.b"). */
export const MIN_HANDLE_LENGTH = 3;

/**
 * Lightweight client-side check for a Bluesky handle before starting OAuth.
 * Requires at least 3 characters and a dot, and rejects spaces and "@"
 * (users often paste "@name.bsky.social"; the server does full resolution).
 */
export function isValidHandle(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length >= MIN_HANDLE_LENGTH &&
    trimmed.includes(".") &&
    !trimmed.includes("@") &&
    !trimmed.includes(" ")
  );
}
