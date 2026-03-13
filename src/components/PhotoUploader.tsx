import { useCallback, useRef } from "react";
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

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const slots = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i] ?? null);

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                className="absolute top-2 right-2 p-1 rounded-full bg-foreground/70 text-background opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              key={`empty-${i}`}
              onClick={() => inputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => e.preventDefault()}
              className="aspect-square rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-muted/50 hover:bg-accent transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              <ImagePlus className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Add photo</span>
            </button>
          )
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Up to {MAX_PHOTOS} photos · {MAX_FILE_SIZE_MB}MB max each
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={remaining > 1}
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
