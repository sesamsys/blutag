/** Maximum number of photos per session */
export const MAX_PHOTOS = 4;

/** Maximum file size per photo in megabytes */
export const MAX_FILE_SIZE_MB = 25;

/** Maximum file size per photo in bytes */
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/** Maximum character length for alt text (Bluesky limit) */
export const MAX_ALT_TEXT_LENGTH = 2000;

/** Duration in ms to show the "Copied" confirmation */
export const COPY_FEEDBACK_DURATION_MS = 2000;

/** Maximum character length for a Bluesky post */
export const BLUESKY_POST_MAX_LENGTH = 300;

/** Maximum image size in bytes for Bluesky uploads (1 MB) */
export const BLUESKY_IMAGE_MAX_BYTES = 1_000_000;

/** Maximum dimension (px) for the longest edge when compressing for Bluesky */
export const BLUESKY_IMAGE_MAX_DIMENSION = 2048;

/** Initial JPEG quality for Bluesky image compression */
export const BLUESKY_IMAGE_JPEG_QUALITY = 0.80;

/** Minimum JPEG quality floor when iteratively compressing */
export const BLUESKY_IMAGE_JPEG_QUALITY_MIN = 0.50;

/** Quality step decrement when iteratively compressing */
export const BLUESKY_IMAGE_JPEG_QUALITY_STEP = 0.05;

/** Display name of the AI model used for analysis */
export const AI_MODEL_DISPLAY_NAME = "Google Gemini";

/** Maximum number of analysis API calls allowed per window */
export const RATE_LIMIT_MAX_CALLS = 10;

/** Rate-limit sliding window duration in milliseconds (1 minute) */
export const RATE_LIMIT_WINDOW_MS = 60_000;
