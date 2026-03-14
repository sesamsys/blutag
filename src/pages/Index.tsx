import { useState, useCallback, useEffect, useMemo } from "react";
import { Sparkles, Github, Linkedin } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";
import AltTextResult from "@/components/AltTextResult";
import BlueskyLoginButton from "@/components/BlueskyLoginButton";
import PostComposer from "@/components/PostComposer";
import FooterLink from "@/components/FooterLink";
import AboutDialog from "@/components/AboutDialog";
import { BlueskyIcon } from "@/components/icons/BlueskyIcon";
import { extractExif } from "@/lib/exif";
import { supabase } from "@/integrations/supabase/client";
import { metaData } from "@/lib/metaData";
import type { PhotoFile } from "@/types/photo";
import { toast } from "sonner";
import { MAX_PHOTOS, RATE_LIMIT_MAX_CALLS, RATE_LIMIT_WINDOW_MS } from "@/lib/constants";
import { arrayMove } from "@dnd-kit/sortable";
import { savePhotosSession, loadPhotosSession, clearPhotosSession } from "@/lib/session-persistence";
import { ERROR_MESSAGES, getErrorMessage, logError, ErrorType, AppError } from "@/lib/error-messages";
import { retryWithTimeout } from "@/lib/retry";
import { createRateLimiter } from "@/lib/rate-limiter";

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const Index = () => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [hasResults, setHasResults] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const rateLimiter = useMemo(
    () => createRateLimiter({ maxCalls: RATE_LIMIT_MAX_CALLS, windowMs: RATE_LIMIT_WINDOW_MS }),
    []
  );

  // Restore session from IndexedDB (survives OAuth redirects)
  useEffect(() => {
    loadPhotosSession()
      .then((restored) => {
        if (restored && restored.length > 0) {
          setPhotos(restored);
          const hasAltText = restored.some((p) => p.altText);
          if (hasAltText) setHasResults(true);
        }
      })
      .catch((err) => {
        logError(err, { context: "session_load" });
        // Don't show error toast - this is a non-critical failure
      });
  }, []);

  const handleAddPhotos = useCallback((files: File[]) => {
    const newPhotos: PhotoFile[] = files.map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, MAX_PHOTOS));
  }, []);

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setPhotos((prev) => {
      prev.forEach((p) => URL.revokeObjectURL(p.preview));
      return [];
    });
  }, []);

  const handleReorderPhotos = useCallback((oldIndex: number, newIndex: number) => {
    setPhotos((prev) => arrayMove(prev, oldIndex, newIndex));
  }, []);

  const handleUpdateAltText = useCallback((id: string, text: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, altText: text } : p))
    );
  }, []);

  const analyzePhotos = async () => {
    if (photos.length === 0 || isAnalyzing) return;

    // Client-side rate limiting
    if (!rateLimiter.canProceed()) {
      const waitSec = Math.ceil(rateLimiter.msUntilNextSlot() / 1000);
      toast.error(`Too many requests. Please try again in ${waitSec}s.`);
      return;
    }
    rateLimiter.record();

    setIsAnalyzing(true);
    setHasResults(true);
    setPhotos((prev) => prev.map((p) => ({ ...p, analyzing: true })));

    const analyzeOne = async (photo: PhotoFile) => {
      try {
        const [base64, exifData] = await Promise.all([
          fileToBase64(photo.file),
          extractExif(photo.file).catch((err) => {
            logError(err, { context: "exif_extraction", photoId: photo.id });
            return {}; // Continue without EXIF data
          }),
        ]);

        // Retry with timeout (30 seconds per request, up to 3 attempts)
        const result = await retryWithTimeout(
          async () => {
            const { data, error } = await supabase.functions.invoke("analyze-photo", {
              body: { imageBase64: base64, exifData },
            });

            if (error) {
              // Check for specific error types
              if (error.message?.includes("429")) {
                throw new AppError(
                  ERROR_MESSAGES.ALT_TEXT_RATE_LIMIT,
                  ErrorType.RATE_LIMIT,
                  error
                );
              }
              if (error.message?.includes("402")) {
                throw new AppError(
                  ERROR_MESSAGES.ALT_TEXT_QUOTA_EXCEEDED,
                  ErrorType.QUOTA,
                  error,
                  false // Not retryable
                );
              }
              throw error;
            }

            return data;
          },
          30000, // 30 second timeout
          {
            maxAttempts: 3,
            onRetry: (_error, attempt) => {
              toast.info(`Retrying analysis (attempt ${attempt + 1}/3)...`);
            },
          }
        );

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, altText: result.altText, exifData, analyzing: false }
              : p
          )
        );
      } catch (err) {
        logError(err, { context: "photo_analysis", photoId: photo.id });
        
        const errorMessage = getErrorMessage(err);
        toast.error(errorMessage);
        
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, analyzing: false } : p
          )
        );
      }
    };

    await Promise.all(photos.map(analyzeOne));

    setIsAnalyzing(false);

    // Save to IndexedDB so state survives OAuth redirects
    setPhotos((current) => {
      savePhotosSession(current).catch((err) => {
        logError(err, { context: "session_save" });
        toast.warning(ERROR_MESSAGES.SESSION_SAVE_FAILED);
      });
      return current;
    });
  };

  const handleReset = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setHasResults(false);
    clearPhotosSession().catch((err) => {
      logError(err, { context: "session_clear" });
    });
  };

  // Cleanup object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      photos.forEach((p) => URL.revokeObjectURL(p.preview));
    };
  }, [photos]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-4 h-4 text-primary-foreground"
              >
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight">Blutag</h1>
          </div>
          <BlueskyLoginButton />
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 flex flex-col gap-8">
        {!hasResults ? (
          <>
            {/* Hero */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                AI-powered alt text for{" "}
                <span className="text-primary">Bluesky</span>
              </h2>
              <p className="text-muted-foreground text-base max-w-md mx-auto">
                Upload your photos and get meaningful, descriptive alt text to
                make your posts accessible to everyone.
              </p>
            </div>

            {/* Upload area */}
            <PhotoUploader
              photos={photos}
              onAddPhotos={handleAddPhotos}
              onRemovePhoto={handleRemovePhoto}
              onClearAll={handleClearAll}
              onReorderPhotos={handleReorderPhotos}
            />

            {/* Generate button */}
            {photos.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={analyzePhotos}
                  disabled={isAnalyzing}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5" />
                  {isAnalyzing ? "Analyzing…" : "Generate alt text"}
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Results */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Your alt text</h2>
              <button
                onClick={handleReset}
                className="px-4 py-1.5 rounded-full border border-border text-sm font-medium hover:bg-accent transition-colors"
              >
                Start over
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {photos.map((photo, i) => (
                <AltTextResult
                  key={photo.id}
                  photo={photo}
                  index={i}
                  onUpdateAltText={handleUpdateAltText}
                />
              ))}
            </div>

            {/* Post composer — visible when logged in */}
            <PostComposer photos={photos} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 flex flex-col items-center gap-3">
          <AboutDialog />
          <p className="text-xs text-muted-foreground">
            Created by{" "}
            <FooterLink href={metaData.bluesky} ariaLabel="Bluesky">
              @sesam.hu on Bluesky
            </FooterLink>{" "}
            using{" "}
            <FooterLink href={metaData.lovable} ariaLabel="Lovable">
              💖 Lovable
            </FooterLink>{" "}
            and{" "}
            <FooterLink href={metaData.kiro} ariaLabel="Kiro">
              👻 Kiro
            </FooterLink>
            .
          </p>
          <div className="flex items-center gap-4">
            <a
              href={metaData.bluesky}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Bluesky"
            >
              <BlueskyIcon className="w-5 h-5" />
            </a>
            <a
              href={metaData.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
            <a
              href={metaData.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
