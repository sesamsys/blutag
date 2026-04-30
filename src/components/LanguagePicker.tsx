import { useMemo, useState } from "react";
import { Globe, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  ALL_LANGUAGES,
  CURATED_LANGUAGES,
  getLanguage,
  type Language,
} from "@/lib/languages";
import { cn } from "@/lib/utils";

interface LanguagePickerProps {
  variant?: "pill" | "compact";
  className?: string;
}

export default function LanguagePicker({
  variant = "pill",
  className,
}: LanguagePickerProps) {
  const { language, setLanguage, recent } = useLanguage();
  const [open, setOpen] = useState(false);
  const current = getLanguage(language);

  const recentLanguages: Language[] = useMemo(
    () =>
      recent
        .filter((c) => c !== language)
        .map((c) => getLanguage(c)),
    [recent, language]
  );

  const curatedFiltered = useMemo(
    () =>
      CURATED_LANGUAGES.filter(
        (l) => !recentLanguages.some((r) => r.code === l.code)
      ),
    [recentLanguages]
  );

  // Show "other" languages: ALL minus what's already in curated/recent
  const otherLanguages = useMemo(() => {
    const shownCodes = new Set([
      ...recentLanguages.map((l) => l.code),
      ...CURATED_LANGUAGES.map((l) => l.code),
    ]);
    return ALL_LANGUAGES.filter((l) => !shownCodes.has(l.code));
  }, [recentLanguages]);

  const handleSelect = (code: string) => {
    setLanguage(code);
    setOpen(false);
  };

  const triggerClasses =
    variant === "pill"
      ? "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      : "inline-flex items-center gap-1 underline-offset-2 hover:underline text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Output language: ${current.nameEn}. Click to change.`}
          className={cn(triggerClasses, className)}
        >
          <Globe className={variant === "pill" ? "w-3.5 h-3.5" : "w-3 h-3"} />
          <span>{current.nameEn}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <Command>
          <CommandInput placeholder="Search languages…" />
          <CommandList className="max-h-72">
            <CommandEmpty>No languages found.</CommandEmpty>

            {recentLanguages.length > 0 && (
              <CommandGroup heading="Recent">
                {recentLanguages.map((l) => (
                  <LangRow
                    key={`recent-${l.code}`}
                    lang={l}
                    selected={l.code === language}
                    onSelect={handleSelect}
                  />
                ))}
              </CommandGroup>
            )}

            <CommandGroup heading="Common">
              {curatedFiltered.map((l) => (
                <LangRow
                  key={`curated-${l.code}`}
                  lang={l}
                  selected={l.code === language}
                  onSelect={handleSelect}
                />
              ))}
            </CommandGroup>

            <CommandGroup heading="Other">
              {otherLanguages.map((l) => (
                <LangRow
                  key={`other-${l.code}`}
                  lang={l}
                  selected={l.code === language}
                  onSelect={handleSelect}
                />
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function LangRow({
  lang,
  selected,
  onSelect,
}: {
  lang: Language;
  selected: boolean;
  onSelect: (code: string) => void;
}) {
  return (
    <CommandItem
      value={`${lang.nameEn} ${lang.nativeName} ${lang.code}`}
      onSelect={() => onSelect(lang.code)}
      className="flex items-center justify-between gap-2"
    >
      <span className="flex flex-col">
        <span className="text-sm">{lang.nameEn}</span>
        {lang.nativeName !== lang.nameEn && (
          <span className="text-xs text-muted-foreground">
            {lang.nativeName}
          </span>
        )}
      </span>
      {selected && <Check className="w-4 h-4 text-primary shrink-0" />}
    </CommandItem>
  );
}
