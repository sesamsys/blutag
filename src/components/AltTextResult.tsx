import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { PhotoFile } from "@/types/photo";

const MAX_ALT_LENGTH = 2000;

interface AltTextResultProps {
  photo: PhotoFile;
  onUpdateAltText: (id: string, text: string) => void;
}

export default function AltTextResult({ photo, onUpdateAltText }: AltTextResultProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!photo.altText) return;
    await navigator.clipboard.writeText(photo.altText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-4 p-4 bg-card rounded-2xl border border-border">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
        <img
          src={photo.preview}
          alt="Thumbnail"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 flex flex-col gap-2 min-w-0">
        {photo.analyzing ? (
          <div className="flex items-center gap-2 h-full">
            <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-sm text-muted-foreground">Analyzing…</span>
          </div>
        ) : (
          <>
            <textarea
              value={photo.altText ?? ""}
              onChange={(e) => onUpdateAltText(photo.id, e.target.value.slice(0, MAX_ALT_LENGTH))}
              rows={3}
              maxLength={MAX_ALT_LENGTH}
              className="w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="Alt text will appear here…"
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {(photo.altText?.length ?? 0).toLocaleString()}/{MAX_ALT_LENGTH.toLocaleString()}
              </span>
              <button
                onClick={handleCopy}
                disabled={!photo.altText}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
