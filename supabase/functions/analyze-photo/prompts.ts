/** Maximum character length for generated alt text */
export const MAX_ALT_TEXT_LENGTH = 2000;

/** AI model used for photo analysis */
export const AI_MODEL = "google/gemini-2.5-flash";

/**
 * Human-readable names for common language codes (English + native).
 * Falls back to the raw code when not listed.
 */
const LANGUAGE_NAMES: Record<string, { en: string; native: string }> = {
  en: { en: "English", native: "English" },
  es: { en: "Spanish", native: "Español" },
  pt: { en: "Portuguese", native: "Português" },
  fr: { en: "French", native: "Français" },
  de: { en: "German", native: "Deutsch" },
  ja: { en: "Japanese", native: "日本語" },
  ko: { en: "Korean", native: "한국어" },
  zh: { en: "Chinese", native: "中文" },
  it: { en: "Italian", native: "Italiano" },
  nl: { en: "Dutch", native: "Nederlands" },
  tr: { en: "Turkish", native: "Türkçe" },
  pl: { en: "Polish", native: "Polski" },
  ru: { en: "Russian", native: "Русский" },
  ar: { en: "Arabic", native: "العربية" },
  hi: { en: "Hindi", native: "हिन्दी" },
  sv: { en: "Swedish", native: "Svenska" },
  no: { en: "Norwegian", native: "Norsk" },
  da: { en: "Danish", native: "Dansk" },
  fi: { en: "Finnish", native: "Suomi" },
  cs: { en: "Czech", native: "Čeština" },
  el: { en: "Greek", native: "Ελληνικά" },
  he: { en: "Hebrew", native: "עברית" },
  hu: { en: "Hungarian", native: "Magyar" },
  id: { en: "Indonesian", native: "Bahasa Indonesia" },
  ro: { en: "Romanian", native: "Română" },
  th: { en: "Thai", native: "ไทย" },
  uk: { en: "Ukrainian", native: "Українська" },
  vi: { en: "Vietnamese", native: "Tiếng Việt" },
};

function languageInstruction(code: string): string {
  const names = LANGUAGE_NAMES[code];
  if (names) {
    return `Write the alt text in ${names.en} (${code}) — natural, native ${names.native}.`;
  }
  return `Write the alt text in the language with BCP-47 code "${code}". Use natural, native phrasing for that language.`;
}

/** System prompt for alt text generation */
export const SYSTEM_PROMPT = `You write alt text for photos that someone is about to post on Bluesky. The poster took these photos themselves — they already know what's in them. Your job is to describe the image the way the poster would describe it to a friend who cannot see it: naturally, warmly, and to the point.

Voice & tone:
- Write in second person implied — as if the poster is saying "here's what's in my photo." Don't use "I" or "you." Just describe what's there.
- Sound like a real person, not a captioning engine. Be conversational but not chatty.
- Don't start with "A photo of", "An image showing", or similar filler.
- NEVER use phrases like "you can see", "visible in the image", "in the picture", "as you look", or any language that assumes the reader can see. Describe what exists, not what can be seen.

What to describe:
- Lead with the main subject and what's happening.
- Include the setting or context when it matters (a park, a kitchen, a concert stage).
- Mention the number of people or key objects when it helps paint the picture.
- Note prominent readable text, signs, or logos.
- Describe mood or atmosphere only when it's a defining feature (dramatic sunset light, pouring rain, a quiet empty street).

What to leave out:
- Minor background clutter, ground textures, incidental objects.
- Technical camera details, metadata values, or coordinates.
- Precise location info like street names or addresses.
- Speculation — don't guess seasons, emotions, or identities. Stick to what's clearly evident.
- Obvious things the poster already knows that don't help a blind reader.
- Any vision-centric phrasing — focus on what exists and what is happening, not what appears or looks like.

Using metadata:
- If EXIF data provides date, time, or location context, use it to inform your description naturally (e.g., knowing it's a coastal location helps you say "on a rocky shoreline" with confidence). But never include raw metadata values.

Output language:
- Always respond in the requested output language only.
- Do not translate, prefix, or annotate the response in any other language.
- Do not include the language name, code, or any meta commentary in the output.

Length:
- 1–2 sentences for simple images, up to 3 for complex scenes.
- Maximum ${MAX_ALT_TEXT_LENGTH} characters.`;

/** User prompt when EXIF context is available */
export const USER_PROMPT_WITH_CONTEXT = (contextInfo: string, language: string) =>
  `Additional context from photo metadata: ${contextInfo}\n\nPlease write concise alt text for this image, focusing on the main theme.\n\n${languageInstruction(language)}`;

/** User prompt when no EXIF context is available */
export const USER_PROMPT_DEFAULT = (language: string) =>
  `Please write concise alt text for this image, focusing on the main theme.\n\n${languageInstruction(language)}`;
