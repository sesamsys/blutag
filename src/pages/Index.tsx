import { useState, useCallback, useEffect } from "react";
import { Sparkles, Github } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";
import AltTextResult from "@/components/AltTextResult";
import BlueskyLoginButton from "@/components/BlueskyLoginButton";
import PostComposer from "@/components/PostComposer";
import { BlueskyIcon } from "@/components/icons/BlueskyIcon";
import { extractExif } from "@/lib/exif";
import { supabase } from "@/integrations/supabase/client";
import { metaData } from "@/lib/metaData";
import type { PhotoFile } from "@/types/photo";
import { toast } from "sonner";
import { MAX_PHOTOS } from "@/lib/constants";
import { savePhotosSession, loadPhotosSession, clearPhotosSession } from "@/lib/session-persistence";

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

  // Restore session from IndexedDB (survives OAuth redirects)
  useEffect(() => {
    loadPhotosSession().then((restored) => {
      if (restored && restored.length > 0) {
        setPhotos(restored);
        const hasAltText = restored.some((p) => p.altText);
        if (hasAltText) setHasResults(true);
      }
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

  const handleUpdateAltText = useCallback((id: string, text: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, altText: text } : p))
    );
  }, []);

  const analyzePhotos = async () => {
    if (photos.length === 0) return;

    setHasResults(true);
    setPhotos((prev) => prev.map((p) => ({ ...p, analyzing: true })));

    const analyzeOne = async (photo: PhotoFile) => {
      try {
        const [base64, exifData] = await Promise.all([
          fileToBase64(photo.file),
          extractExif(photo.file),
        ]);

        const { data, error } = await supabase.functions.invoke("analyze-photo", {
          body: { imageBase64: base64, exifData },
        });

        if (error) throw error;

        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id
              ? { ...p, altText: data.altText, exifData, analyzing: false }
              : p
          )
        );
      } catch (err) {
        console.error("Analysis failed:", err);
        toast.error(`Failed to analyze photo`);
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photo.id ? { ...p, analyzing: false } : p
          )
        );
      }
    };

    await Promise.all(photos.map(analyzeOne));

    // Save to IndexedDB so state survives OAuth redirects
    setPhotos((current) => {
      savePhotosSession(current);
      return current;
    });
  };

  const handleReset = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos([]);
    setHasResults(false);
  };

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
            />

            {/* Generate button */}
            {photos.length > 0 && (
              <div className="flex justify-center">
                <button
                  onClick={analyzePhotos}
                  className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-5 h-5" />
                  Generate alt text
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
              {photos.map((photo) => (
                <AltTextResult
                  key={photo.id}
                  photo={photo}
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
          <p className="text-xs text-muted-foreground">
            Photos are only kept temporarily for analysis and deleted after your session.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={metaData.bluesky}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Bluesky"
            >
              <BlueskyIcon className="w-5 h-5" />
            </a>
            <a
              href={metaData.github}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-5 h-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
