export interface Language {
  code: string;
  nameEn: string;
  nativeName: string;
}

/** Curated short list of common Bluesky languages, shown first. */
export const CURATED_LANGUAGES: Language[] = [
  { code: "en", nameEn: "English", nativeName: "English" },
  { code: "es", nameEn: "Spanish", nativeName: "Español" },
  { code: "pt", nameEn: "Portuguese", nativeName: "Português" },
  { code: "fr", nameEn: "French", nativeName: "Français" },
  { code: "de", nameEn: "German", nativeName: "Deutsch" },
  { code: "ja", nameEn: "Japanese", nativeName: "日本語" },
  { code: "ko", nameEn: "Korean", nativeName: "한국어" },
  { code: "zh", nameEn: "Chinese", nativeName: "中文" },
  { code: "it", nameEn: "Italian", nativeName: "Italiano" },
  { code: "nl", nameEn: "Dutch", nativeName: "Nederlands" },
  { code: "tr", nameEn: "Turkish", nativeName: "Türkçe" },
  { code: "pl", nameEn: "Polish", nativeName: "Polski" },
  { code: "ru", nameEn: "Russian", nativeName: "Русский" },
  { code: "ar", nameEn: "Arabic", nativeName: "العربية" },
  { code: "hi", nameEn: "Hindi", nativeName: "हिन्दी" },
];

/**
 * Extended ISO 639-1 list (all entries used in addition to curated).
 * Curated codes are also represented here so search works uniformly.
 */
export const ALL_LANGUAGES: Language[] = [
  { code: "af", nameEn: "Afrikaans", nativeName: "Afrikaans" },
  { code: "sq", nameEn: "Albanian", nativeName: "Shqip" },
  { code: "am", nameEn: "Amharic", nativeName: "አማርኛ" },
  { code: "ar", nameEn: "Arabic", nativeName: "العربية" },
  { code: "hy", nameEn: "Armenian", nativeName: "Հայերեն" },
  { code: "as", nameEn: "Assamese", nativeName: "অসমীয়া" },
  { code: "az", nameEn: "Azerbaijani", nativeName: "Azərbaycanca" },
  { code: "eu", nameEn: "Basque", nativeName: "Euskara" },
  { code: "be", nameEn: "Belarusian", nativeName: "Беларуская" },
  { code: "bn", nameEn: "Bengali", nativeName: "বাংলা" },
  { code: "bs", nameEn: "Bosnian", nativeName: "Bosanski" },
  { code: "br", nameEn: "Breton", nativeName: "Brezhoneg" },
  { code: "bg", nameEn: "Bulgarian", nativeName: "Български" },
  { code: "my", nameEn: "Burmese", nativeName: "မြန်မာ" },
  { code: "ca", nameEn: "Catalan", nativeName: "Català" },
  { code: "ceb", nameEn: "Cebuano", nativeName: "Cebuano" },
  { code: "zh", nameEn: "Chinese", nativeName: "中文" },
  { code: "co", nameEn: "Corsican", nativeName: "Corsu" },
  { code: "hr", nameEn: "Croatian", nativeName: "Hrvatski" },
  { code: "cs", nameEn: "Czech", nativeName: "Čeština" },
  { code: "da", nameEn: "Danish", nativeName: "Dansk" },
  { code: "nl", nameEn: "Dutch", nativeName: "Nederlands" },
  { code: "en", nameEn: "English", nativeName: "English" },
  { code: "eo", nameEn: "Esperanto", nativeName: "Esperanto" },
  { code: "et", nameEn: "Estonian", nativeName: "Eesti" },
  { code: "fo", nameEn: "Faroese", nativeName: "Føroyskt" },
  { code: "fi", nameEn: "Finnish", nativeName: "Suomi" },
  { code: "fr", nameEn: "French", nativeName: "Français" },
  { code: "fy", nameEn: "Frisian", nativeName: "Frysk" },
  { code: "gl", nameEn: "Galician", nativeName: "Galego" },
  { code: "ka", nameEn: "Georgian", nativeName: "ქართული" },
  { code: "de", nameEn: "German", nativeName: "Deutsch" },
  { code: "el", nameEn: "Greek", nativeName: "Ελληνικά" },
  { code: "gu", nameEn: "Gujarati", nativeName: "ગુજરાતી" },
  { code: "ht", nameEn: "Haitian Creole", nativeName: "Kreyòl Ayisyen" },
  { code: "ha", nameEn: "Hausa", nativeName: "Hausa" },
  { code: "haw", nameEn: "Hawaiian", nativeName: "ʻŌlelo Hawaiʻi" },
  { code: "he", nameEn: "Hebrew", nativeName: "עברית" },
  { code: "hi", nameEn: "Hindi", nativeName: "हिन्दी" },
  { code: "hmn", nameEn: "Hmong", nativeName: "Hmoob" },
  { code: "hu", nameEn: "Hungarian", nativeName: "Magyar" },
  { code: "is", nameEn: "Icelandic", nativeName: "Íslenska" },
  { code: "ig", nameEn: "Igbo", nativeName: "Igbo" },
  { code: "id", nameEn: "Indonesian", nativeName: "Bahasa Indonesia" },
  { code: "ga", nameEn: "Irish", nativeName: "Gaeilge" },
  { code: "it", nameEn: "Italian", nativeName: "Italiano" },
  { code: "ja", nameEn: "Japanese", nativeName: "日本語" },
  { code: "jv", nameEn: "Javanese", nativeName: "Basa Jawa" },
  { code: "kn", nameEn: "Kannada", nativeName: "ಕನ್ನಡ" },
  { code: "kk", nameEn: "Kazakh", nativeName: "Қазақша" },
  { code: "km", nameEn: "Khmer", nativeName: "ខ្មែរ" },
  { code: "rw", nameEn: "Kinyarwanda", nativeName: "Kinyarwanda" },
  { code: "ko", nameEn: "Korean", nativeName: "한국어" },
  { code: "ku", nameEn: "Kurdish", nativeName: "Kurdî" },
  { code: "ky", nameEn: "Kyrgyz", nativeName: "Кыргызча" },
  { code: "lo", nameEn: "Lao", nativeName: "ລາວ" },
  { code: "la", nameEn: "Latin", nativeName: "Latina" },
  { code: "lv", nameEn: "Latvian", nativeName: "Latviešu" },
  { code: "lt", nameEn: "Lithuanian", nativeName: "Lietuvių" },
  { code: "lb", nameEn: "Luxembourgish", nativeName: "Lëtzebuergesch" },
  { code: "mk", nameEn: "Macedonian", nativeName: "Македонски" },
  { code: "mg", nameEn: "Malagasy", nativeName: "Malagasy" },
  { code: "ms", nameEn: "Malay", nativeName: "Bahasa Melayu" },
  { code: "ml", nameEn: "Malayalam", nativeName: "മലയാളം" },
  { code: "mt", nameEn: "Maltese", nativeName: "Malti" },
  { code: "mi", nameEn: "Maori", nativeName: "Māori" },
  { code: "mr", nameEn: "Marathi", nativeName: "मराठी" },
  { code: "mn", nameEn: "Mongolian", nativeName: "Монгол" },
  { code: "ne", nameEn: "Nepali", nativeName: "नेपाली" },
  { code: "no", nameEn: "Norwegian", nativeName: "Norsk" },
  { code: "ny", nameEn: "Nyanja", nativeName: "Chichewa" },
  { code: "or", nameEn: "Odia", nativeName: "ଓଡ଼ିଆ" },
  { code: "ps", nameEn: "Pashto", nativeName: "پښتو" },
  { code: "fa", nameEn: "Persian", nativeName: "فارسی" },
  { code: "pl", nameEn: "Polish", nativeName: "Polski" },
  { code: "pt", nameEn: "Portuguese", nativeName: "Português" },
  { code: "pa", nameEn: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
  { code: "ro", nameEn: "Romanian", nativeName: "Română" },
  { code: "ru", nameEn: "Russian", nativeName: "Русский" },
  { code: "sm", nameEn: "Samoan", nativeName: "Gagana Sāmoa" },
  { code: "gd", nameEn: "Scots Gaelic", nativeName: "Gàidhlig" },
  { code: "sr", nameEn: "Serbian", nativeName: "Српски" },
  { code: "st", nameEn: "Sesotho", nativeName: "Sesotho" },
  { code: "sn", nameEn: "Shona", nativeName: "ChiShona" },
  { code: "sd", nameEn: "Sindhi", nativeName: "سنڌي" },
  { code: "si", nameEn: "Sinhala", nativeName: "සිංහල" },
  { code: "sk", nameEn: "Slovak", nativeName: "Slovenčina" },
  { code: "sl", nameEn: "Slovenian", nativeName: "Slovenščina" },
  { code: "so", nameEn: "Somali", nativeName: "Soomaali" },
  { code: "es", nameEn: "Spanish", nativeName: "Español" },
  { code: "su", nameEn: "Sundanese", nativeName: "Basa Sunda" },
  { code: "sw", nameEn: "Swahili", nativeName: "Kiswahili" },
  { code: "sv", nameEn: "Swedish", nativeName: "Svenska" },
  { code: "tl", nameEn: "Tagalog", nativeName: "Tagalog" },
  { code: "tg", nameEn: "Tajik", nativeName: "Тоҷикӣ" },
  { code: "ta", nameEn: "Tamil", nativeName: "தமிழ்" },
  { code: "tt", nameEn: "Tatar", nativeName: "Татарча" },
  { code: "te", nameEn: "Telugu", nativeName: "తెలుగు" },
  { code: "th", nameEn: "Thai", nativeName: "ไทย" },
  { code: "tr", nameEn: "Turkish", nativeName: "Türkçe" },
  { code: "tk", nameEn: "Turkmen", nativeName: "Türkmençe" },
  { code: "uk", nameEn: "Ukrainian", nativeName: "Українська" },
  { code: "ur", nameEn: "Urdu", nativeName: "اردو" },
  { code: "ug", nameEn: "Uyghur", nativeName: "ئۇيغۇرچە" },
  { code: "uz", nameEn: "Uzbek", nativeName: "Oʻzbekcha" },
  { code: "vi", nameEn: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "cy", nameEn: "Welsh", nativeName: "Cymraeg" },
  { code: "xh", nameEn: "Xhosa", nativeName: "isiXhosa" },
  { code: "yi", nameEn: "Yiddish", nativeName: "ייִדיש" },
  { code: "yo", nameEn: "Yoruba", nativeName: "Yorùbá" },
  { code: "zu", nameEn: "Zulu", nativeName: "isiZulu" },
];

const LANG_BY_CODE = new Map<string, Language>(
  ALL_LANGUAGES.map((l) => [l.code, l])
);

/** Validate BCP-47-ish code: 2-3 letter primary, optional region. */
const LANG_CODE_RE = /^[a-z]{2,3}(-[A-Z]{2})?$/;

export function isValidLangCode(code: string | null | undefined): boolean {
  if (!code || typeof code !== "string") return false;
  return LANG_CODE_RE.test(code);
}

/** Normalize to primary subtag (e.g. "pt-BR" → "pt"). */
export function normalizeLangCode(code: string | null | undefined): string {
  if (!code) return "en";
  const trimmed = code.trim();
  const primary = trimmed.split("-")[0]?.toLowerCase();
  if (!primary) return "en";
  return LANG_BY_CODE.has(primary) ? primary : "en";
}

export function getLanguage(code: string): Language {
  return LANG_BY_CODE.get(code) ?? LANG_BY_CODE.get("en")!;
}

export function getLanguageName(code: string): string {
  return getLanguage(code).nameEn;
}
