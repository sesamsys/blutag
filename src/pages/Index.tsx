import { useState, useCallback } from "react";
import { Sparkles } from "lucide-react";
import PhotoUploader from "@/components/PhotoUploader";
import AltTextResult from "@/components/AltTextResult";
import { extractExif } from "@/lib/exif";
import { supabase } from "@/integrations/supabase/client";
import type { PhotoFile } from "@/types/photo";
import { toast } from "sonner";

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

  const handleAddPhotos = useCallback((files: File[]) => {
    const newPhotos: PhotoFile[] = files.map((file) => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 4));
  }, []);

  const handleRemovePhoto = useCallback((index: number) => {
    setPhotos((prev) => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].preview);
      copy.splice(index, 1);
      return copy;
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
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">B</span>
          </div>
          <h1 className="text-lg font-bold tracking-tight">Blutag</h1>
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
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center">
          <p className="text-xs text-muted-foreground">
            Photos are only kept temporarily for analysis and deleted after your session.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
