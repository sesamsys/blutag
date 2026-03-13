import { useCallback, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import type { PhotoFile } from "@/types/photo";
import { MAX_PHOTOS, MAX_FILE_SIZE_MB, MAX_FILE_SIZE_BYTES } from "@/lib/constants";

interface PhotoUploaderProps {
  photos: PhotoFile[];
  onAddPhotos: (files: File[]) => void;
  onRemovePhoto: (index: number) => void;
  onClearAll?: () => void;
}

export default function PhotoUploader({ photos, onAddPhotos, onRemovePhoto, onClearAll }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const remaining = MAX_PHOTOS - photos.length;

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      if (remaining <= 0) return;

      const allValid: File[] = [];
      Array.from(fileList).forEach((f) => {
        if (!f.type.startsWith("image/")) return;
        if (f.size > MAX_FILE_SIZE_BYTES) return;
        allValid.push(f);
      });

      if (allValid.length > remaining) {
        toast.warning(`You can only add up to ${MAX_PHOTOS} photos. ${allValid.length - remaining} photo${allValid.length - remaining === 1 ? " was" : "s were"} not added.`);
      }

      const accepted = allValid.slice(0, remaining);
      if (accepted.length) onAddPhotos(accepted);
    },
    [remaining, onAddPhotos]
  );

  const onDropZone = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] ?? null);
  const isEmpty = photos.length === 0;

  return (
    <div className="w-full">
      <div className="flex justify-end mb-2 h-7">
        {photos.length > 0 && onClearAll && (
          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            Clear all
          </button>
        )}
      </div>

      {/* Wrapper for drag-and-drop + annotation */}
      <div className="relative">
        <div
          onDrop={onDropZone}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl transition-all ${
            isDraggingOver
              ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
              : ""
          }`}
        >
          {slots.map((photo, i) =>
            photo ? (
              <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden bg-muted group">
                <img
                  src={photo.preview}
                  alt={`Upload ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => onRemovePhoto(i)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-foreground/70 text-background hover:bg-foreground/90 transition-colors"
                  aria-label="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                key={`empty-${i}`}
                onClick={() => inputRef.current?.click()}
                className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/50 hover:bg-accent transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
              >
                <ImagePlus className="w-6 h-6 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">Add photo</span>
              </button>
            )
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-2 text-center">
        Up to {MAX_PHOTOS} photos · {MAX_FILE_SIZE_MB}MB max each
      </p>

      {/* Handwritten annotation below info text — only when no photos */}
      {isEmpty && (
        <div className="pointer-events-none select-none flex items-center justify-center gap-4 mt-3">
          <span
            className="text-primary text-2xl sm:text-3xl -rotate-2 shrink-0 leading-none"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            Drag photos here
          </span>
          {/* Loopy arrow: starts from text midpoint, loops, then curves upward */}
          <svg
            width="100"
            height="100"
            viewBox="0 0 260 180"
            fill="none"
            className="text-primary shrink-0 -ml-1"
            overflow="visible"
          >
            {/* Path: starts mid-left at text midpoint height, loops, then goes up */}
            <path
              d="M3,90c117.55-1.32,145.35-55.27,126.78-88.72-16.81-30.27-53.04-1.85-33.04,21.18,23.82,27.42,122.95,20.47,126.09-96.39"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Arrowhead: two lines forming a V-shape at the end */}
            <path
              d="M209.29,-62.5 L222.83,-80 M236.37,-62.5 L222.83,-80"
              stroke="currentColor"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />
          </svg>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
